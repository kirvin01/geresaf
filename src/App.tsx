import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    TextField, Button, Modal, Box, Typography, Container, Paper, Grid,
    Select, MenuItem, FormControl, InputLabel, CircularProgress,
    Alert, IconButton, InputAdornment, Chip, Divider, Avatar, Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import type { GridColDef, GridRenderCellParams, GridRowParams } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import CakeIcon from '@mui/icons-material/Cake';
import WcIcon from '@mui/icons-material/Wc';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FilterListIcon from '@mui/icons-material/FilterList';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { createTheme, ThemeProvider, alpha } from '@mui/material/styles';
import { API_CONFIG } from './config';
import { login, logout, isAuthenticated, authHeader } from './authService';
import './App.css';

// --- Theme ---
const theme = createTheme({
    palette: {
        primary: { main: '#1565C0', light: '#42a5f5', dark: '#0d47a1' },
        secondary: { main: '#00897B' },
        background: { default: '#EEF2F7', paper: '#ffffff' },
        text: { primary: '#1A2332', secondary: '#5A6A7E' },
    },
    typography: {
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        h4: { fontWeight: 700, letterSpacing: '-0.5px' },
        h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
                contained: {
                    boxShadow: '0 2px 8px rgba(21,101,192,0.3)',
                    '&:hover': { boxShadow: '0 4px 16px rgba(21,101,192,0.4)' }
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } }
            }
        },
        MuiPaper: {
            styleOverrides: { root: { backgroundImage: 'none' } }
        }
    }
});

// --- Interfaces ---
interface Paciente {
    Abrev_Tipo_Doc: string; Numero_Documento: string;
    Fecha_Nacimiento: string; Genero: string; EDAD: number; id: string;
}
interface Atencion {
    N: string; Id_Cita: string; F_ATENCION: string; Codigo_Item: string;
    Descripcion_Item: string; LAB1: string; LAB2: string; LAB3: string;
    F_REGISTRO: string; F_MODIFICACION: string | null; ESTABLECIMIENTO: string;
    'DISTRITO | PROVINCIA': string; SISTEMA: string | null; REGISTRADOR: string; id: string;
}
interface NotificationState { key: number; severity: 'error' | 'info' | 'warning'; message: string; }

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : '';
}

// --- Columnas Atenciones ---
const columnsAtenciones: GridColDef[] = [
    { field: 'N', headerName: '#', width: 50, sortable: false },
    { field: 'F_ATENCION', headerName: 'Fecha', width: 100, sortable: false },
    { field: 'Codigo_Item', headerName: 'Código', width: 90, sortable: false },
    { field: 'Descripcion_Item', headerName: 'Descripción', flex: 1, minWidth: 220, sortable: false },
    { field: 'LAB1', headerName: 'Lab 1', width: 30, sortable: false },
    { field: 'LAB2', headerName: 'Lab 2', width: 30, sortable: false },
    { field: 'LAB3', headerName: 'Lab 3', width: 30, sortable: false },
    { field: 'F_REGISTRO', headerName: 'F. Registro', width: 150, sortable: false },
    { field: 'ESTABLECIMIENTO', headerName: 'Establecimiento', flex: 1, minWidth: 180, sortable: false },
    { field: 'DISTRITO | PROVINCIA', headerName: 'Dist. | Prov.', width: 150, sortable: false },
    { field: 'SISTEMA', headerName: 'Sistema', width: 110, sortable: false },
    { field: 'REGISTRADOR', headerName: 'Registrador', width: 180, sortable: false },
];

// --- Info Card ---
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
            borderRadius: 2, bgcolor: alpha('#1565C0', 0.04),
            border: '1px solid', borderColor: alpha('#1565C0', 0.1), minWidth: 0,
        }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha('#1565C0', 0.1), color: 'primary.main' }}>
                {icon}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>{label}</Typography>
                <Typography variant="body2" fontWeight={600} noWrap>{value}</Typography>
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Pantalla de Login
// ---------------------------------------------------------------------------
function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (username: string) => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;
        setLoading(true);
        setError(null);
        try {
            await login(API_CONFIG.baseURL, { username, password });
            onLoginSuccess(username);
        } catch (err: unknown) {
            setError(getErrorMessage(err) || 'Error al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh', width: '100%',
            background: 'linear-gradient(135deg, #0d47a1 0%, #1565C0 45%, #1976D2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            px: 2,
        }}>
            {/* Decoración de fondo */}
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                overflow: 'hidden', pointerEvents: 'none',
            }}>
                {[...Array(3)].map((_, i) => (
                    <Box key={i} sx={{
                        position: 'absolute',
                        width: { xs: 200, md: 350 + i * 100 },
                        height: { xs: 200, md: 350 + i * 100 },
                        borderRadius: '50%',
                        border: '1px solid',
                        borderColor: 'rgba(255,255,255,0.08)',
                        top: `${-10 + i * 15}%`,
                        right: `${-15 + i * 5}%`,
                    }} />
                ))}
                <Box sx={{
                    position: 'absolute', bottom: '-5%', left: '-5%',
                    width: { xs: 200, md: 400 }, height: { xs: 200, md: 400 },
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                }} />
            </Box>

            <Paper elevation={0} sx={{
                width: '100%', maxWidth: 420,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                position: 'relative',
            }}>
                {/* Header del card */}
                <Box sx={{
                    px: 4, pt: 4, pb: 3,
                    background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                }}>
                    <Avatar sx={{
                        width: 64, height: 64,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    }}>
                        <LocalHospitalIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={700} color="white" sx={{ lineHeight: 1.2 }}>
                            GERESA — HIS MINSA
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Sistema de Historial de Atenciones
                        </Typography>
                    </Box>
                </Box>

                {/* Formulario */}
                <Box component="form" onSubmit={handleSubmit} sx={{ px: 4, py: 3.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <LockOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                            Iniciar Sesión
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountCircleIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading || !username || !password}
                            sx={{ mt: 1, height: 48 }}
                        >
                            {loading
                                ? <CircularProgress size={22} color="inherit" />
                                : 'Ingresar'
                            }
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ px: 4, pb: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.disabled">
                        Gerencia Regional de Salud Cusco
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------
function App() {
    // --- Auth state ---
    const [authenticated, setAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<string>('');

    // Al cargar, verifica si ya hay sesión activa
    useEffect(() => {
        if (isAuthenticated()) {
            setAuthenticated(true);
            // Intenta recuperar el username del token almacenado
            try {
                const token = localStorage.getItem('geresa_token')!;
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUser(payload.sub || '');
            } catch {
                setCurrentUser('');
            }
        }
    }, []);

    const handleLoginSuccess = (username: string) => {
        setCurrentUser(username);
        setAuthenticated(true);
    };

    const handleLogout = () => {
        logout();
        setAuthenticated(false);
        setCurrentUser('');
        setPacientes([]);
        setNdoc('');
        setNotification(null);
    };

    // --- App state ---
    const [ndoc, setNdoc] = useState('');
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loadingPacientes, setLoadingPacientes] = useState(false);
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
    const [atenciones, setAtenciones] = useState<Atencion[]>([]);
    const [loadingAtenciones, setLoadingAtenciones] = useState(false);
    const [selectedAnio, setSelectedAnio] = useState<number>(new Date().getFullYear());
    const [filtroCodigo, setFiltroCodigo] = useState('');
    const [atencionesPageSize, setAtencionesPageSize] = useState(15);
    const [selectedMes, setSelectedMes] = useState<number>(new Date().getMonth() + 1);

    const anios = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
    const meses = useMemo(() => [
        { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
    ], []);

    // Función auxiliar: fetch con token, maneja 401 automáticamente
    const apiFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
        const response = await fetch(url, {
            ...options,
            headers: { ...authHeader(), ...options.headers },
        });
        if (response.status === 401) {
            // Token expirado o inválido → forzar logout
            logout();
            setAuthenticated(false);
            setCurrentUser('');
            setNotification({ key: Date.now(), severity: 'warning', message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.' });
            throw new Error('Sesión expirada');
        }
        return response;
    }, []);

    const handleSearchPacientes = async () => {
        if (loadingPacientes || !ndoc) return;
        setLoadingPacientes(true);
        setNotification(null);
        setPacientes([]);
        try {
            const response = await apiFetch(`${API_CONFIG.baseURL}/paciente?ndoc=${ndoc}`);
            if (!response.ok) throw new Error('Error del servidor');
            const data = await response.json();
            const pacientesData = data.result || [];
            setPacientes(pacientesData.map((p: Paciente, index: number) => ({
                ...p, id: `${p.Numero_Documento}-${p.Abrev_Tipo_Doc}-${index}`
            })));
            if (pacientesData.length === 0)
                setNotification({ key: Date.now(), severity: 'info', message: 'No se encontraron pacientes con ese documento.' });
        } catch (err: unknown) {
            if (getErrorMessage(err) !== 'Sesión expirada')
                setNotification({ key: Date.now(), severity: 'error', message: 'Error de conexión con el servidor.' });
        } finally {
            setLoadingPacientes(false);
        }
    };

    const fetchAtenciones = useCallback(async (signal?: AbortSignal) => {
        if (!selectedPaciente) return;

        setLoadingAtenciones(true);
        try {
            const params = new URLSearchParams({
                anio: selectedAnio.toString(),
                mes: selectedMes.toString(),
                ndoc: selectedPaciente.Numero_Documento,
            });
            const response = await apiFetch(`${API_CONFIG.baseURL}/atenciones?${params.toString()}`, { signal });
            if (!response.ok) throw new Error('Error del servidor');
            const data = await response.json();
            const atencionesData = data.result || [];
            setAtenciones(atencionesData.map((a: Atencion) => ({ ...a, id: `${a.Id_Cita}-${a.Codigo_Item}` })));
            if (atencionesData.length === 0)
                setNotification({ key: Date.now(), severity: 'info', message: `Sin atenciones registradas en ${meses.find(m => m.value === selectedMes)?.label} ${selectedAnio}.` });
            else
                setNotification(null);
        } catch (error: unknown) {
            if ((error instanceof DOMException && error.name === 'AbortError') || getErrorMessage(error) === 'Sesión expirada') return;
            setNotification({ key: Date.now(), severity: 'error', message: 'Error al cargar atenciones.' });
        } finally {
            setLoadingAtenciones(false);
        }
    }, [selectedPaciente, selectedAnio, selectedMes, apiFetch, meses]);


    useEffect(() => {
        const controller = new AbortController();
        if (modalOpen && selectedPaciente) fetchAtenciones(controller.signal);
        return () => controller.abort();
    }, [modalOpen, selectedAnio, selectedMes, selectedPaciente, fetchAtenciones]);
    const handleRowDoubleClick = useCallback((params: GridRowParams | GridRenderCellParams) => {
        if (loadingAtenciones) return;
        setSelectedPaciente(params.row as Paciente);
        setSelectedAnio(new Date().getFullYear());
        setSelectedMes(new Date().getMonth() + 1);
        setFiltroCodigo('');
        setNotification(null);
        setModalOpen(true);
    }, [loadingAtenciones]);

    const handleCloseModal = () => { setModalOpen(false); setAtenciones([]); setNotification(null); };

    const filteredAtenciones = atenciones.filter(a =>
        a.Codigo_Item.toLowerCase().includes(filtroCodigo.toLowerCase()) ||
        a.Descripcion_Item?.toLowerCase().includes(filtroCodigo.toLowerCase())
    );

    const columnsPacientes: GridColDef[] = useMemo(() => [
        {
            field: 'Abrev_Tipo_Doc', headerName: 'Tipo', width: 80, sortable: false,
            headerAlign: 'center', align: 'center',
            renderCell: (p) => <Chip label={p.value} size="small" color="primary" variant="outlined" />
        },
        { field: 'Numero_Documento', headerName: 'N° Documento', flex: 1, minWidth: 130, sortable: false, headerAlign: 'center', align: 'center' },
        { field: 'Fecha_Nacimiento', headerName: 'Fec. Nacimiento', flex: 1, minWidth: 130, sortable: false, headerAlign: 'center', align: 'center' },
        {
            field: 'Genero', headerName: 'Género', flex: 1, minWidth: 90, sortable: false,
            headerAlign: 'center', align: 'center',
            renderCell: (p) => (
                <Chip label={p.value} size="small" sx={{
                    bgcolor: p.value === 'M' ? alpha('#1565C0', 0.1) : alpha('#E91E63', 0.1),
                    color: p.value === 'M' ? '#1565C0' : '#E91E63',
                    fontWeight: 600, border: 'none'
                }} />
            )
        },
        {
            field: 'EDAD', headerName: 'Edad', type: 'number', width: 70, sortable: false,
            headerAlign: 'center', align: 'center',
            renderCell: (p) => <Typography variant="body2" fontWeight={700} color="primary">{p.value} a.</Typography>
        },
        {
            field: 'actions', headerName: 'Atenciones', sortable: false, headerAlign: 'center',
            align: 'center', width: 130,
            renderCell: (params: GridRenderCellParams) => (
                <Tooltip title="Ver historial de atenciones">
                    <Button
                        variant="contained" size="small" color="primary"
                        startIcon={<EventNoteIcon fontSize="small" />}
                        disabled={loadingAtenciones}
                        onClick={() => handleRowDoubleClick(params)}
                        sx={{ fontSize: '0.75rem' }}
                    >
                        Ver
                    </Button>
                </Tooltip>
            )
        }
    ], [handleRowDoubleClick, loadingAtenciones]);

    if (!authenticated) {
        return (
            <ThemeProvider theme={theme}>
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{
                minHeight: '100vh', width: '100%',
                background: 'linear-gradient(135deg, #EEF2F7 0%, #E3EBF6 100%)',
                py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 }
            }}>
                <Container maxWidth="xl" disableGutters sx={{ px: { xs: 1, sm: 2 } }}>

                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{
                            width: { xs: 44, md: 52 }, height: { xs: 44, md: 52 },
                            bgcolor: 'primary.main', boxShadow: '0 4px 14px rgba(21,101,192,0.4)'
                        }}>
                            <LocalHospitalIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" fontWeight={700} color="primary.dark" sx={{ lineHeight: 1.2 }}>
                                GERESA — HIS MINSA
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Sistema de consulta de historial médico
                            </Typography>
                        </Box>

                        {/* Usuario + Logout */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                icon={<AccountCircleIcon />}
                                label={currentUser}
                                variant="outlined"
                                color="primary"
                                size="small"
                                sx={{ fontWeight: 600 }}
                            />
                            <Tooltip title="Cerrar sesión">
                                <IconButton
                                    onClick={handleLogout}
                                    size="small"
                                    sx={{
                                        color: 'text.secondary',
                                        border: '1px solid',
                                        borderColor: alpha('#1565C0', 0.2),
                                        '&:hover': { bgcolor: alpha('#d32f2f', 0.08), borderColor: '#d32f2f', color: '#d32f2f' }
                                    }}
                                >
                                    <LogoutIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Search Card */}
                    <Paper elevation={0} sx={{
                        p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3,
                        border: '1px solid', borderColor: alpha('#1565C0', 0.12),
                        boxShadow: '0 4px 24px rgba(21,101,192,0.08)'
                    }}>
                        <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SearchIcon fontSize="small" /> Búsqueda de Pacientes
                        </Typography>
                        <Box
                            component="form"
                            onSubmit={(e) => { e.preventDefault(); handleSearchPacientes(); }}
                            sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}
                        >
                            <TextField
                                fullWidth
                                label="Número de Documento"
                                placeholder="Ingrese DNI, CE u otro documento..."
                                value={ndoc}
                                onChange={(e) => setNdoc(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BadgeIcon color="action" fontSize="small" />
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loadingPacientes || !ndoc}
                                sx={{ minWidth: { xs: '100%', sm: '140px' }, height: 56 }}
                                startIcon={loadingPacientes ? undefined : <SearchIcon />}
                            >
                                {loadingPacientes ? <CircularProgress size={22} color="inherit" /> : 'Buscar'}
                            </Button>
                        </Box>

                        {notification && !modalOpen && (
                            <Alert severity={notification.severity} sx={{ mt: 2, borderRadius: 2 }} key={notification.key}>
                                {notification.message}
                            </Alert>
                        )}
                    </Paper>

                    {/* Results Table */}
                    {pacientes.length > 0 && (
                        <Paper elevation={0} sx={{
                            borderRadius: 3, overflow: 'hidden',
                            border: '1px solid', borderColor: alpha('#1565C0', 0.12),
                            boxShadow: '0 4px 24px rgba(21,101,192,0.08)'
                        }}>
                            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha('#1565C0', 0.03), borderBottom: '1px solid', borderColor: alpha('#1565C0', 0.1) }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    {pacientes.length} resultado{pacientes.length !== 1 ? 's' : ''} encontrado{pacientes.length !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                            <Box sx={{ width: '100%' }}>
                                <DataGrid
                                    rows={pacientes}
                                    columns={columnsPacientes}
                                    loading={loadingPacientes}
                                    onRowDoubleClick={handleRowDoubleClick}
                                    autoHeight
                                    disableColumnMenu
                                    disableColumnSelector
                                    pageSize={5}
                                    rowsPerPageOptions={[5, 10, 20]}
                                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                                    sx={{
                                        border: 'none',
                                        '& .MuiDataGrid-columnHeaders': {
                                            bgcolor: alpha('#1565C0', 0.05),
                                            borderBottom: `2px solid ${alpha('#1565C0', 0.15)}`,
                                        },
                                        '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.8rem', color: '#1A2332' },
                                        '& .MuiDataGrid-row:hover': { bgcolor: alpha('#1565C0', 0.04) },
                                        '& .MuiDataGrid-cell': { borderColor: alpha('#000', 0.05) },
                                        '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${alpha('#000', 0.08)}` },
                                    }}
                                />
                            </Box>
                        </Paper>
                    )}
                </Container>

                {/* Modal Atenciones */}
                <Modal open={modalOpen} onClose={handleCloseModal} sx={{ px: { xs: 1, sm: 2 } }}>
                    <Box sx={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '98%', maxWidth: '98vw',
                        maxHeight: { xs: '98vh', sm: '95vh' },
                        bgcolor: 'background.paper',
                        borderRadius: { xs: 2, sm: 3 },
                        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        {/* Modal Header */}
                        <Box sx={{
                            px: { xs: 2, md: 3 }, py: 2,
                            background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexShrink: 0,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                                    <EventNoteIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700} color="white" sx={{ lineHeight: 1.2 }}>
                                        Historial de Atenciones
                                    </Typography>
                                    {selectedPaciente && (
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                                            {selectedPaciente.Abrev_Tipo_Doc}: {selectedPaciente.Numero_Documento}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                            <IconButton onClick={handleCloseModal} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        {/* Patient Info Cards */}
                        {selectedPaciente && (
                            <Box sx={{
                                px: { xs: 2, md: 3 }, py: 1.5,
                                bgcolor: alpha('#1565C0', 0.02),
                                borderBottom: '1px solid', borderColor: alpha('#1565C0', 0.1),
                                flexShrink: 0,
                            }}>
                                <Grid container spacing={1.5}>
                                    <Grid item xs={6} sm={3}>
                                        <InfoCard icon={<PersonIcon fontSize="small" />} label="Documento" value={`${selectedPaciente.Abrev_Tipo_Doc}: ${selectedPaciente.Numero_Documento}`} />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <InfoCard icon={<CakeIcon fontSize="small" />} label="Nacimiento" value={selectedPaciente.Fecha_Nacimiento} />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <InfoCard icon={<WcIcon fontSize="small" />} label="Género" value={selectedPaciente.Genero === 'M' ? 'Masculino' : 'Femenino'} />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <InfoCard icon={<BadgeIcon fontSize="small" />} label="Edad" value={`${selectedPaciente.EDAD} años`} />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Filters */}
                        <Box sx={{
                            px: { xs: 2, md: 3 }, py: 1.5,
                            borderBottom: '1px solid', borderColor: alpha('#000', 0.07),
                            flexShrink: 0,
                        }}>
                            <Grid container spacing={1.5} alignItems="center">
                                <Grid item xs={12} sm={5} md={4}>
                                    <TextField
                                        fullWidth size="small"
                                        label="Buscar por código o descripción"
                                        value={filtroCodigo}
                                        onChange={(e) => setFiltroCodigo(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <FilterListIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3} md={2}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Año</InputLabel>
                                        <Select value={selectedAnio} label="Año" onChange={(e) => setSelectedAnio(e.target.value as number)}>
                                            {anios.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6} sm={4} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Mes</InputLabel>
                                        <Select value={selectedMes} label="Mes" onChange={(e) => setSelectedMes(e.target.value as number)}>
                                            {meses.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {!loadingAtenciones && (
                                        <Chip
                                            label={`${filteredAtenciones.length} atención${filteredAtenciones.length !== 1 ? 'es' : ''}`}
                                            color="primary" variant="outlined" size="small"
                                            icon={<EventNoteIcon />}
                                        />
                                    )}
                                </Grid>
                            </Grid>
                        </Box>

                        {notification && (
                            <Box sx={{ px: { xs: 2, md: 3 }, pt: 1, flexShrink: 0 }}>
                                <Alert severity={notification.severity} key={notification.key} sx={{ borderRadius: 2 }}>
                                    {notification.message}
                                </Alert>
                            </Box>
                        )}

                        {/* Data Grid */}
                        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', height: '100%' }}>
                            {loadingAtenciones ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
                                    <CircularProgress size={32} />
                                    <Typography color="text.secondary">Cargando atenciones...</Typography>
                                </Box>
                            ) : (
                                <DataGrid
                                    rows={filteredAtenciones}
                                    columns={columnsAtenciones}
                                    pageSize={atencionesPageSize}
                                    onPageSizeChange={(s) => setAtencionesPageSize(s)}
                                    rowsPerPageOptions={[15, 25, 50, 100]}
                                    density="compact"
                                    autoHeight
                                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                                    sx={{
                                        border: 'none',
                                        '& .MuiDataGrid-columnHeaders': {
                                            bgcolor: alpha('#1565C0', 0.06),
                                            borderBottom: `2px solid ${alpha('#1565C0', 0.15)}`,
                                        },
                                        '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.78rem' },
                                        '& .MuiDataGrid-cell': { fontSize: '0.76rem', borderColor: alpha('#000', 0.04) },
                                        '& .MuiDataGrid-row:hover': { bgcolor: alpha('#1565C0', 0.04) },
                                        '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: alpha('#1565C0', 0.015) },
                                        '& .MuiDataGrid-footerContainer': {
                                            borderTop: `1px solid ${alpha('#000', 0.08)}`,
                                            bgcolor: alpha('#1565C0', 0.02),
                                        },
                                    }}
                                />
                            )}
                        </Box>

                        {/* Modal Footer */}
                        <Divider />
                        <Box sx={{ px: { xs: 2, md: 3 }, py: 1.5, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                            <Button variant="outlined" onClick={handleCloseModal} sx={{ minWidth: 100 }}>
                                Cerrar
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            </Box>
        </ThemeProvider>
    );
}

export default App;

import { useState, useEffect, useCallback } from 'react';
import { 
    TextField, Button, Modal, Box, Typography, Container, Paper, Grid, 
    Select, MenuItem, FormControl, InputLabel, CircularProgress, 
    Alert, IconButton, InputAdornment
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import type { GridColDef, GridRenderCellParams, GridRowParams } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { API_CONFIG } from './config';
import './App.css';

// --- Interfaces de Tipos ---
interface Paciente { Abrev_Tipo_Doc: string; Numero_Documento: string; Fecha_Nacimiento: string; Genero: string; EDAD: number; id: string; }
interface Atencion {
    N: string;
    Id_Cita: string;
    F_ATENCION: string;
    Codigo_Item: string;
    Descripcion_Item: string;
    LAB1: string;
    LAB2: string;
    LAB3: string;
    F_REGISTRO: string;
    F_MODIFICACION: string | null;
    ESTABLECIMIENTO: string;
    'DISTRITO | PROVINCIA': string;
    SISTEMA: string | null;
    REGISTRADOR: string;
    id: string;
}
interface NotificationState { key: number; severity: 'error' | 'info'; message: string; }

// --- Definiciones de Columnas ---
const columnsAtenciones: GridColDef[] = [
    { field: 'N', headerName: 'N', width: 3, sortable: false },
    { field: 'Id_Cita', headerName: 'ID Cita', width: 90, sortable: false },
    { field: 'F_ATENCION', headerName: 'F. Atención', width: 100, sortable: false },
    { field: 'Codigo_Item', headerName: 'Código', width: 100, sortable: false },
    { field: 'Descripcion_Item', headerName: 'Descripción', flex: 1, minWidth: 250, sortable: false },
    { field: 'LAB1', headerName: 'Lab 1', width: 50, sortable: false },
    { field: 'LAB2', headerName: 'Lab 2', width: 50, sortable: false },
    { field: 'LAB3', headerName: 'Lab 3', width: 50, sortable: false },
    { field: 'F_REGISTRO', headerName: 'F. Registro', width: 150, sortable: false },
    { field: 'F_MODIFICACION', headerName: 'F. Modificación', width: 150, sortable: false },
    { field: 'ESTABLECIMIENTO', headerName: 'Establecimiento', flex: 1, minWidth: 200, sortable: false },
    { field: 'DISTRITO | PROVINCIA', headerName: 'Distrito | Provincia', width: 200, sortable: false },
    { field: 'SISTEMA', headerName: 'Sistema', width: 120, sortable: false },
    { field: 'REGISTRADOR', headerName: 'Registrador', width: 200, sortable: false },
];

// --- Componente Principal ---
function App() {
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
    const [atencionesPageSize, setAtencionesPageSize] = useState(13);

    const anios = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

    const handleSearchPacientes = async () => {
        if (!ndoc) return;
        setLoadingPacientes(true);
        setNotification(null);
        setPacientes([]);
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/paciente?ndoc=${ndoc}`);
            if (!response.ok) throw new Error('Error del servidor');
            const data = await response.json(); // Espera { result: [] }
            const pacientesData = data.result || [];
            setPacientes(pacientesData.map((p: Paciente) => ({ ...p, id: p.Numero_Documento })));
            if (pacientesData.length === 0) {
                setNotification({ key: Date.now(), severity: 'info', message: 'No se encontraron pacientes.' });
            }
        } catch (error) {
            setNotification({ key: Date.now(), severity: 'error', message: 'No se pudo conectar con el servidor. Verifique la API y la configuración de CORS.' });
        } finally {
            setLoadingPacientes(false);
        }
    };

    const fetchAtenciones = useCallback(async () => {
        if (!selectedPaciente) return;
        setLoadingAtenciones(true);
        try {
            const params = new URLSearchParams({
                anio: selectedAnio.toString(),
                ndoc: selectedPaciente.Numero_Documento,
            });
            const response = await fetch(`${API_CONFIG.baseURL}/atenciones?${params.toString()}`);
            if (!response.ok) throw new Error('Error del servidor');
            const data = await response.json(); // Espera { result: [] }
            const atencionesData = data.result || [];
            setAtenciones(atencionesData.map((a: Atencion) => ({ ...a, id: `${a.Id_Cita}-${a.Codigo_Item}` })));
            if (atencionesData.length === 0) {
                if (!filtroCodigo) {
                    setNotification({ key: Date.now(), severity: 'info', message: `No hay atenciones registradas para el año ${selectedAnio}.` });
                }
            }
        } catch (error) {
            console.error("Error al buscar atenciones:", error);
            setNotification({ key: Date.now(), severity: 'error', message: 'No se pudo cargar las atenciones. Verifique la conexión.' });
        } finally {
            setLoadingAtenciones(false);
        }
    }, [selectedPaciente, selectedAnio, filtroCodigo]);

    useEffect(() => {
        if (modalOpen) {
            fetchAtenciones();
        }
    }, [modalOpen, fetchAtenciones]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearchPacientes();
    };

    const handleRowDoubleClick = (params: GridRowParams | GridRenderCellParams) => {
        setSelectedPaciente(params.row as Paciente);
        setSelectedAnio(new Date().getFullYear());
        setFiltroCodigo('');
        setModalOpen(true);
    };

    const handleCloseModal = () => setModalOpen(false);
    
    const filteredAtenciones = atenciones.filter(a => a.Codigo_Item.toLowerCase().includes(filtroCodigo.toLowerCase()));

    const columnsPacientes: GridColDef[] = [
        { field: 'Abrev_Tipo_Doc', headerName: 'Tipo Doc', flex: 1, minWidth: 80, sortable: false, headerAlign: 'center', align: 'center' },
        { field: 'Numero_Documento', headerName: 'N° Documento', flex: 1, minWidth: 120, sortable: false, headerAlign: 'center', align: 'center' },
        { field: 'Fecha_Nacimiento', headerName: 'Fec. Nacimiento', flex: 1, minWidth: 120, sortable: false, headerAlign: 'center', align: 'center' },
        { field: 'Genero', headerName: 'Género', flex: 1, minWidth: 80, sortable: false, headerAlign: 'center', align: 'center' },
        { field: 'EDAD', headerName: 'Edad', type: 'number', flex: 1, minWidth: 70, sortable: false, headerAlign: 'center', align: 'center' },
        {
            field: 'actions',
            headerName: 'Acciones',
            sortable: false,
            headerAlign: 'center',
            align: 'center',
            flex: 1,
            minWidth: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleRowDoubleClick(params)}
                >
                    Detalles
                </Button>
            )
        }
    ];

    return (
        <Container className="App" maxWidth="lg">
            <Paper elevation={3} sx={{ padding: '2rem', borderRadius: '15px' }}>
                <Typography variant="h4" component="h1" gutterBottom>Búsqueda de Pacientes</Typography>
                <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField fullWidth label="Número de Documento" variant="outlined" value={ndoc} onChange={(e) => setNdoc(e.target.value)} />
                    <Button type="submit" variant="contained" startIcon={<SearchIcon />} sx={{ ml: 2, height: '56px', flexShrink: 0 }}>Buscar</Button>
                </Box>
                {notification && <Alert key={notification.key} severity={notification.severity} sx={{ mb: 2 }}>{notification.message}</Alert>}
                <Box sx={{ height: 400, width: '100%' }}>
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
                    />
                </Box>
            </Paper>

            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={styles.modalStyle}>
                    <IconButton aria-label="close" onClick={handleCloseModal} sx={styles.closeButton}><CloseIcon /></IconButton>
                    <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Detalle de Atenciones</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={5} sx={styles.infoItem}><PersonIcon sx={{ mr: 1, color: 'primary.main' }} /><Typography variant="body2"><b>Paciente:</b> {selectedPaciente && `${selectedPaciente.Abrev_Tipo_Doc}: ${selectedPaciente.Numero_Documento}`}</Typography></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth label="Buscar por Código Item" variant="standard" value={filtroCodigo} onChange={(e) => setFiltroCodigo(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>)}} /></Grid>
                            <Grid item xs={12} sm={3}><FormControl fullWidth size="small"><InputLabel>Año</InputLabel><Select value={selectedAnio} label="Año" onChange={(e) => setSelectedAnio(e.target.value as number)}>{anios.map(anio => <MenuItem key={anio} value={anio}>{anio}</MenuItem>)}</Select></FormControl></Grid>
                        </Grid>
                    </Paper>
                    {notification && <Alert key={notification.key} severity={notification.severity} sx={{ mb: 1 }}>{notification.message}</Alert>}
                    <Box sx={{ height: 600, width: '100%' }}>
                        {loadingAtenciones ? <Box sx={styles.centerFlex}><CircularProgress /></Box> : <DataGrid 
                            rows={filteredAtenciones} 
                            columns={columnsAtenciones} 
                            pageSize={atencionesPageSize}
                            onPageSizeChange={(newPageSize) => setAtencionesPageSize(newPageSize)}
                            rowsPerPageOptions={[13, 25, 50]}
                            density="compact" 
                            sx={styles.dataGrid} 
                            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        />}
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}><Button variant="outlined" color="primary" onClick={handleCloseModal}>Cerrar</Button></Box>
                </Box>
            </Modal>
        </Container>
    );
}

const styles = { 
    modalStyle: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '1300px',
        bgcolor: 'background.paper',
        border: '1px solid #ddd',
        borderRadius: '10px',
        boxShadow: 24,
        p: 2.5,
    },
    closeButton: { position: 'absolute', right: 8, top: 8, color: (theme: any) => theme.palette.grey[500] },
    infoItem: { display: 'flex', alignItems: 'center' },
    centerFlex: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' },
    dataGrid: { '& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.8rem' }, '& .MuiDataGrid-cell': { fontSize: '0.75rem' } }
 };

export default App;

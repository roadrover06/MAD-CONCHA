import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  Skeleton
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from "@mui/icons-material";
import AppSidebar from "../AppSidebar";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

// Firestore helpers
const getEmployees = async () => {
  const snapshot = await getDocs(collection(db, "employees"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];
};

const addEmployee = async (emp: Omit<Employee, "id">) => {
  const docRef = await addDoc(collection(db, "employees"), emp);
  return docRef.id;
};

const updateEmployee = async (emp: Employee) => {
  const empRef = doc(db, "employees", emp.id);
  await updateDoc(empRef, { 
    firstName: emp.firstName, 
    lastName: emp.lastName
  });
};

const deleteEmployee = async (id: string) => {
  const empRef = doc(db, "employees", id);
  await deleteDoc(empRef);
};

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface EmployeeManagementPageProps {
  onLogout?: () => void;
  onProfile?: () => void;
  firstName?: string;
  lastName?: string;
}

const EmployeeManagementPage: React.FC<EmployeeManagementPageProps> = ({
  onLogout,
  onProfile,
  firstName,
  lastName
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({ 
    firstName: "", 
    lastName: ""
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: "", 
    severity: "success" as "success" | "error" | "info" 
  });
  
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));
  const isMd = useMediaQuery(theme.breakpoints.down("md"));

  // Validation state
  const [addError, setAddError] = useState({ 
    firstName: false, 
    lastName: false
  });
  
  const [editError, setEditError] = useState({ 
    firstName: false, 
    lastName: false
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const emps = await getEmployees();
      setEmployees(emps);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: "Failed to load employees", 
        severity: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    const errors = {
      firstName: !newEmployee.firstName.trim(),
      lastName: !newEmployee.lastName.trim()
    };
    setAddError(errors);
    if (Object.values(errors).some(Boolean)) return;
    try {
      await addEmployee(newEmployee);
      setSnackbar({ 
        open: true, 
        message: "Employee added successfully!", 
        severity: "success" 
      });
      setAddDialogOpen(false);
      setNewEmployee({ 
        firstName: "", 
        lastName: ""
      });
      fetchEmployees();
    } catch {
      setSnackbar({ 
        open: true, 
        message: "Failed to add employee", 
        severity: "error" 
      });
    }
  };

  const handleEditEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditDialogOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    const errors = {
      firstName: !selectedEmployee.firstName.trim(),
      lastName: !selectedEmployee.lastName.trim()
    };
    setEditError(errors);
    if (Object.values(errors).some(Boolean)) return;
    try {
      await updateEmployee(selectedEmployee);
      setSnackbar({ 
        open: true, 
        message: "Employee updated successfully!", 
        severity: "success" 
      });
      setEditDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch {
      setSnackbar({ 
        open: true, 
        message: "Failed to update employee", 
        severity: "error" 
      });
    }
  };

  const handleDeleteEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee(selectedEmployee.id);
      setSnackbar({ 
        open: true, 
        message: "Employee deleted successfully!", 
        severity: "success" 
      });
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch {
      setSnackbar({ 
        open: true, 
        message: "Failed to delete employee", 
        severity: "error" 
      });
    }
  };

  const filterEmployees = (emps: Employee[]) => {
    if (!search.trim()) return emps;
    const s = search.trim().toLowerCase();
    return emps.filter(
      e =>
        e.firstName.toLowerCase().includes(s) ||
        e.lastName.toLowerCase().includes(s)
    );
  };

  // Stats
  const totalEmployees = employees.length;
  const initials = (emp: Employee) =>
    `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase();

  return (
    <AppSidebar
      role="admin"
      firstName={firstName}
      lastName={lastName}
      onLogout={onLogout}
      onProfile={onProfile}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          mt: { xs: 1, sm: 3 },
          px: { xs: 1, sm: 2 },
          pb: 4
        }}
      >
        {/* Stats Section */}
        <Box sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          flexWrap: "wrap"
        }}>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #1976d2", bgcolor: "background.paper"
          }}>
            <PersonIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Employees</Typography>
              <Typography variant="h6" fontWeight={700}>{totalEmployees}</Typography>
            </Box>
          </Paper>
        </Box>

        {/* Header Section */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3 },
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            borderRadius: 3,
            boxShadow: theme.shadows[2],
            background: theme.palette.background.paper
          }}
        >
          <Box>
            <Typography
              variant={isSm ? "h6" : "h5"}
              fontWeight={700}
              color="primary"
              sx={{ mb: 0.5 }}
            >
              Employee Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employees.length} {employees.length === 1 ? "employee" : "employees"} registered
            </Typography>
          </Box>
          
          <Stack
            direction={isSm ? "column" : "row"}
            spacing={2}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <TextField
              size="small"
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 2,
                  background: theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d'
                }
              }}
              sx={{
                minWidth: { xs: "100%", sm: 250 },
                flex: 1
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                minWidth: { xs: "100%", sm: 160 },
                fontWeight: 600,
                borderRadius: 2,
                height: 40,
                bgcolor: "primary.main",
                ":hover": { bgcolor: "primary.dark" }
              }}
            >
              {isSm ? "Add" : "Add Employee"}
            </Button>
          </Stack>
        </Paper>

        {/* Employee Table */}
        <Paper
          sx={{
            borderRadius: 3,
            boxShadow: theme.shadows[2],
            overflow: "hidden",
            mb: 2
          }}
        >
          {loading ? (
            <Box sx={{ p: 3 }}>
              {[...Array(5)].map((_, index) => (
                <Skeleton 
                  key={index} 
                  variant="rectangular" 
                  height={56} 
                  sx={{ 
                    mb: 1, 
                    borderRadius: 1 
                  }} 
                />
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table
                sx={{
                  minWidth: 350,
                  "& th": { 
                    fontWeight: 700, 
                    background: theme.palette.mode === 'light' ? '#f9fafb' : '#1e1e1e',
                    position: "sticky",
                    top: 0,
                    zIndex: 1
                  },
                  "& tr": {
                    transition: "background 0.2s"
                  },
                  "& tr:hover": {
                    background: theme.palette.mode === 'light' ? '#f5f7fa' : '#2a2a2a'
                  }
                }}
                size={isSm ? "small" : "medium"}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterEmployees(employees).map((emp) => (
                    <TableRow
                      key={emp.id}
                      hover
                      sx={{
                        '&:last-child td': { borderBottom: 0 }
                      }}
                    >
                      <TableCell sx={{ py: { xs: 1, sm: 2 } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar 
                            src={emp.avatar} 
                            sx={{ 
                              width: 36, 
                              height: 36,
                              bgcolor: theme.palette.primary.main,
                              fontWeight: 700,
                              fontSize: 18
                            }}
                          >
                            {initials(emp)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>
                              {emp.firstName} {emp.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Employee ID: {emp.id.slice(0, 8)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ py: { xs: 1, sm: 2 } }}>
                        <Stack 
                          direction="row" 
                          spacing={1} 
                          justifyContent="flex-end"
                        >
                          <Tooltip title="Edit">
                            <IconButton
                              color="primary"
                              onClick={() => handleEditEmployee(emp)}
                              size={isSm ? "small" : "medium"}
                              sx={{ 
                                bgcolor: "primary.light",
                                '&:hover': {
                                  backgroundColor: "primary.main",
                                  color: "#fff"
                                }
                              }}
                            >
                              <EditIcon fontSize={isSm ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteEmployee(emp)}
                              size={isSm ? "small" : "medium"}
                              sx={{ 
                                bgcolor: "error.light",
                                '&:hover': {
                                  backgroundColor: "error.main",
                                  color: "#fff"
                                }
                              }}
                            >
                              <DeleteIcon fontSize={isSm ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {!loading && filterEmployees(employees).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Box sx={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          alignItems: "center",
                          gap: 1
                        }}>
                          <PersonIcon 
                            fontSize="large" 
                            color="disabled" 
                            sx={{ fontSize: 48 }} 
                          />
                          <Typography variant="h6" color="text.secondary">
                            No employees found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {search.trim() ? "Try a different search" : "Add your first employee"}
                          </Typography>
                          {!search.trim() && (
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => setAddDialogOpen(true)}
                              sx={{ mt: 2 }}
                            >
                              Add Employee
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Add Employee Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            p: 1,
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          Add New Employee
          <IconButton 
            onClick={() => setAddDialogOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={3}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80,
                  bgcolor: theme.palette.primary.main,
                  fontSize: 32,
                  mb: 2
                }}
              >
                <PersonIcon fontSize="large" />
              </Avatar>
            </Box>
            
            <Stack 
              direction={{ xs: "column", sm: "row" }} 
              spacing={3}
            >
              <TextField
                label="First Name"
                fullWidth
                margin="normal"
                value={newEmployee.firstName}
                onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                error={addError.firstName}
                helperText={addError.firstName ? "First name is required" : ""}
                autoFocus
                inputProps={{ maxLength: 32 }}
              />
              <TextField
                label="Last Name"
                fullWidth
                margin="normal"
                value={newEmployee.lastName}
                onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                error={addError.lastName}
                helperText={addError.lastName ? "Last name is required" : ""}
                inputProps={{ maxLength: 32 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setAddDialogOpen(false)} 
            sx={{ 
              borderRadius: 2,
              px: 3,
              color: theme.palette.text.secondary
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddEmployee}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              px: 3
            }}
            startIcon={<CheckIcon />}
          >
            Add Employee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            p: 1,
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          Edit Employee
          <IconButton 
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={3}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Avatar
                src={selectedEmployee?.avatar}
                sx={{ 
                  width: 80, 
                  height: 80,
                  bgcolor: theme.palette.primary.main,
                  fontSize: 32,
                  mb: 2
                }}
              >
                {selectedEmployee ? initials(selectedEmployee) : ""}
              </Avatar>
            </Box>
            
            <Stack 
              direction={{ xs: "column", sm: "row" }} 
              spacing={3}
            >
              <TextField
                label="First Name"
                fullWidth
                margin="normal"
                value={selectedEmployee?.firstName || ""}
                onChange={e =>
                  setSelectedEmployee(selectedEmployee
                    ? { ...selectedEmployee, firstName: e.target.value }
                    : null
                  )
                }
                error={editError.firstName}
                helperText={editError.firstName ? "First name is required" : ""}
                autoFocus
                inputProps={{ maxLength: 32 }}
              />
              <TextField
                label="Last Name"
                fullWidth
                margin="normal"
                value={selectedEmployee?.lastName || ""}
                onChange={e =>
                  setSelectedEmployee(selectedEmployee
                    ? { ...selectedEmployee, lastName: e.target.value }
                    : null
                  )
                }
                error={editError.lastName}
                helperText={editError.lastName ? "Last name is required" : ""}
                inputProps={{ maxLength: 32 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            sx={{ 
              borderRadius: 2,
              px: 3,
              color: theme.palette.text.secondary
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateEmployee}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              px: 3
            }}
            startIcon={<CheckIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Employee Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            p: 1,
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          Confirm Deletion
          <IconButton 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center",
            textAlign: "center",
            gap: 2
          }}>
            <Avatar
              sx={{ 
                width: 64, 
                height: 64,
                bgcolor: theme.palette.error.light,
                mb: 2
              }}
            >
              <DeleteIcon fontSize="large" />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Delete {selectedEmployee?.firstName} {selectedEmployee?.lastName}?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. All associated data will be permanently removed.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            sx={{ 
              borderRadius: 2,
              px: 3,
              color: theme.palette.text.secondary
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeleteEmployee}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              px: 3
            }}
            startIcon={<DeleteIcon />}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ width: "100%" }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppSidebar>
  );
};

export default EmployeeManagementPage;
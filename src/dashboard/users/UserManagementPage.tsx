import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
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
  Select,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Tooltip,
  DialogContentText,
  useMediaQuery,
  useTheme,
  Chip,
  Avatar,
  CircularProgress,
  Badge
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from "@mui/icons-material";
import AppSidebar from "../AppSidebar";
import { getUsers, addUser, acceptUser, updateUser, deleteUser } from "../../firebase/userManagementHelpers";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  status: "pending" | "active" | "disabled";
}

interface UserManagementPageProps {
  onLogout?: () => void;
  onProfile?: () => void;
  firstName?: string;
  lastName?: string;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({
  onLogout,
  onProfile,
  firstName,
  lastName
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [tab, setTab] = useState(0);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [disabledUsers, setDisabledUsers] = useState<User[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ 
    firstName: "", 
    lastName: "", 
    username: "", 
    password: "", 
    role: "cashier", 
    status: "pending" as "pending" | "active" | "disabled" 
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: "", 
    severity: "success" as "success" | "error" 
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const users = await getUsers();
      setPendingUsers(users.filter(u => u.status === "pending"));
      setActiveUsers(users.filter(u => u.status === "active"));
      setDisabledUsers(users.filter(u => u.status === "disabled"));
      setAllUsers(users);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: "Failed to fetch users", 
        severity: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      // Validate fields
      if (!newUser.firstName || !newUser.lastName || !newUser.username || !newUser.password) {
        setSnackbar({ 
          open: true, 
          message: "Please fill all required fields", 
          severity: "error" 
        });
        return;
      }
      
      // Add user to Firestore
      await addDoc(collection(db, "users"), {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        status: newUser.status
      });
      
      setSnackbar({ 
        open: true, 
        message: "User added successfully", 
        severity: "success" 
      });
      setAddDialogOpen(false);
      setNewUser({ 
        firstName: "", 
        lastName: "", 
        username: "", 
        password: "", 
        role: "cashier", 
        status: "pending" 
      });
      fetchUsers();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: "Failed to add user", 
        severity: "error" 
      });
    }
  };

  const handleAcceptUser = async (userId: string) => {
    try {
      await acceptUser(userId);
      setSnackbar({ 
        open: true, 
        message: "User accepted successfully", 
        severity: "success" 
      });
      fetchUsers();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: "Failed to accept user", 
        severity: "error" 
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setSnackbar({ 
        open: true, 
        message: "User deleted successfully", 
        severity: "success" 
      });
      fetchUsers();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: "Failed to delete user", 
        severity: "error" 
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    try {
      // Validate fields
      if (!editUser.firstName || !editUser.lastName || !editUser.username) {
        setSnackbar({ 
          open: true, 
          message: "Please fill all required fields", 
          severity: "error" 
        });
        return;
      }
      
      // Update user in Firestore
      const userRef = doc(db, "users", editUser.id);
      await updateDoc(userRef, {
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        username: editUser.username,
        role: editUser.role,
        status: editUser.status
      });
      
      setSnackbar({ 
        open: true, 
        message: "User updated successfully", 
        severity: "success" 
      });
      setEditDialogOpen(false);
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: "Failed to update user", 
        severity: "error" 
      });
    }
  };

  // Filter users by search
  const filterUsers = (users: User[]) => {
    if (!search.trim()) return users;
    const s = search.trim().toLowerCase();
    return users.filter(
      u =>
        u.firstName.toLowerCase().includes(s) ||
        u.lastName.toLowerCase().includes(s) ||
        u.username.toLowerCase().includes(s) ||
        u.role.toLowerCase().includes(s)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'disabled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string): React.ReactElement | undefined => {
    switch (status) {
      case 'active': return <LockOpenIcon fontSize="small" />;
      case 'disabled': return <LockIcon fontSize="small" />;
      case 'pending': return <PersonIcon fontSize="small" />;
      default: return undefined;
    }
  };

  // Add stats
  const totalUsers = allUsers.length;
  const totalAdmins = allUsers.filter(u => u.role === "admin").length;
  const totalCashiers = allUsers.filter(u => u.role === "cashier").length;

  return (
    <AppSidebar
      role="admin"
      firstName={firstName}
      lastName={lastName}
      onLogout={onLogout}
      onProfile={onProfile}
    >
      <Box sx={{ 
        maxWidth: 1400, 
        mx: "auto", 
        p: isMobile ? 1 : 3,
        width: '100%'
      }}>
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
              <Typography variant="subtitle2" color="text.secondary">Total Users</Typography>
              <Typography variant="h6" fontWeight={700}>{totalUsers}</Typography>
            </Box>
          </Paper>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #43a047", bgcolor: "background.paper"
          }}>
            <LockOpenIcon color="success" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Admins</Typography>
              <Typography variant="h6" fontWeight={700}>{totalAdmins}</Typography>
            </Box>
          </Paper>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #fbc02d", bgcolor: "background.paper"
          }}>
            <LockIcon color="warning" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Cashiers</Typography>
              <Typography variant="h6" fontWeight={700}>{totalCashiers}</Typography>
            </Box>
          </Paper>
        </Box>
        
        <Paper sx={{ 
          p: isMobile ? 2 : 3, 
          mb: 3, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          flexWrap: "wrap", 
          gap: 2,
          borderRadius: 3,
          boxShadow: theme.shadows[2],
          bgcolor: "background.paper"
        }}>
          <Typography variant="h5" fontWeight={700} sx={{ 
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            whiteSpace: 'nowrap'
          }}>
            User Management
          </Typography>
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 2, 
            flexWrap: "wrap",
            width: isMobile ? '100%' : 'auto',
            mt: isMobile ? 1 : 0
          }}>
            <TextField
              size="small"
              placeholder="Search users..."
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
                  background: theme.palette.mode === 'light' ? '#f5f5f5' : '#333',
                  width: isMobile ? '100%' : 220
                }
              }}
              sx={{ 
                flexGrow: isMobile ? 1 : 0,
                minWidth: isMobile ? '100%' : 220
              }}
            />
            <Button 
              variant="contained" 
              onClick={() => setAddDialogOpen(true)}
              startIcon={<AddIcon />}
              sx={{
                whiteSpace: 'nowrap',
                width: isMobile ? '100%' : 'auto',
                borderRadius: 2,
                fontWeight: 600,
                bgcolor: "primary.main",
                ":hover": { bgcolor: "primary.dark" }
              }}
            >
              {isMobile ? 'Add' : 'Add New User'}
            </Button>
          </Box>
        </Paper>
        
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          sx={{ mb: 2 }}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
        >
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              All Users
              <Badge 
                badgeContent={allUsers.length} 
                color="primary" 
                showZero
              />
            </Box>
          } />
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              Pending
              <Badge 
                badgeContent={pendingUsers.length} 
                color="warning" 
                showZero
              />
            </Box>
          } />
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              Active
              <Badge 
                badgeContent={activeUsers.length} 
                color="success" 
                showZero
              />
            </Box>
          } />
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              Disabled
              <Badge 
                badgeContent={disabledUsers.length} 
                color="error" 
                showZero
              />
            </Box>
          } />
        </Tabs>
        
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 200 
          }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tab === 0 && (
              <UserTable 
                users={filterUsers(allUsers)} 
                onEdit={handleEditUser} 
                onDelete={handleDeleteUser} 
                onAccept={handleAcceptUser}
                isMobile={isMobile}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                emptyMessage="No users found"
              />
            )}
            {tab === 1 && (
              <UserTable 
                users={filterUsers(pendingUsers)} 
                onEdit={handleEditUser} 
                onDelete={handleDeleteUser} 
                onAccept={handleAcceptUser}
                isMobile={isMobile}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                emptyMessage="No pending users"
                showAccept={true}
              />
            )}
            {tab === 2 && (
              <UserTable 
                users={filterUsers(activeUsers)} 
                onEdit={handleEditUser} 
                onDelete={handleDeleteUser} 
                isMobile={isMobile}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                emptyMessage="No active users"
              />
            )}
            {tab === 3 && (
              <UserTable 
                users={filterUsers(disabledUsers)} 
                onEdit={handleEditUser} 
                onDelete={handleDeleteUser} 
                isMobile={isMobile}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                emptyMessage="No disabled users"
              />
            )}
          </>
        )}
      </Box>
      
      {/* Add User Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 700
        }}>
          <AddIcon /> Add New User
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="First Name"
            fullWidth
            margin="normal"
            value={newUser.firstName}
            onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
            required
            inputProps={{ maxLength: 30 }}
            helperText="Enter the user's first name"
          />
          <TextField
            label="Last Name"
            fullWidth
            margin="normal"
            value={newUser.lastName}
            onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
            required
            inputProps={{ maxLength: 30 }}
            helperText="Enter the user's last name"
          />
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={newUser.username}
            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
            required
            inputProps={{ maxLength: 20 }}
            helperText="Choose a unique username"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={newUser.password}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            required
            inputProps={{ maxLength: 20 }}
            helperText="Set a secure password"
          />
          <Select
            label="Role"
            fullWidth
            value={newUser.role}
            onChange={e => setNewUser({ ...newUser, role: e.target.value as "admin" | "cashier" })}
            sx={{ mt: 2 }}
          >
            <MenuItem value="cashier">Cashier</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
          <Select
            label="Status"
            fullWidth
            value={newUser.status}
            onChange={e => setNewUser({ ...newUser, status: e.target.value as "pending" | "active" | "disabled" })}
            sx={{ mt: 2, mb: 1 }}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="disabled">Disabled</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setAddDialogOpen(false)} 
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddUser}
            sx={{ ml: 2 }}
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 700
        }}>
          <EditIcon /> Edit User
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="First Name"
            fullWidth
            margin="normal"
            value={editUser?.firstName || ""}
            onChange={e => setEditUser(editUser ? { ...editUser, firstName: e.target.value } : null)}
            required
            inputProps={{ maxLength: 30 }}
            helperText="Edit the user's first name"
          />
          <TextField
            label="Last Name"
            fullWidth
            margin="normal"
            value={editUser?.lastName || ""}
            onChange={e => setEditUser(editUser ? { ...editUser, lastName: e.target.value } : null)}
            required
            inputProps={{ maxLength: 30 }}
            helperText="Edit the user's last name"
          />
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={editUser?.username || ""}
            onChange={e => setEditUser(editUser ? { ...editUser, username: e.target.value } : null)}
            required
            inputProps={{ maxLength: 20 }}
            helperText="Edit the username"
          />
          <Select
            label="Role"
            fullWidth
            value={editUser?.role || ""}
            onChange={e => setEditUser(editUser ? { ...editUser, role: e.target.value as "admin" | "cashier" } : null)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="cashier">Cashier</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
          <Select
            label="Status"
            fullWidth
            value={editUser?.status || ""}
            onChange={e => setEditUser(editUser ? { ...editUser, status: e.target.value as "pending" | "active" | "disabled" } : null)}
            sx={{ mt: 2, mb: 1 }}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="disabled">Disabled</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateUser}
            sx={{ ml: 2 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.error.main,
          color: theme.palette.error.contrastText,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 700
        }}>
          <DeleteIcon /> Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.error.light, mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {userToDelete?.firstName} {userToDelete?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{userToDelete?.username}
              </Typography>
            </Box>
          </Box>
          <DialogContentText>
            Are you sure you want to permanently delete this user account? This action cannot be undone and will remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            variant="outlined"
            color="inherit"
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteUser} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ ml: 2 }}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppSidebar>
  );
};

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onAccept?: (userId: string) => void;
  isMobile: boolean;
  getStatusColor: (status: string) => any;
  getStatusIcon: (status: string) => React.ReactElement | undefined;
  emptyMessage: string;
  showAccept?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onDelete,
  onAccept,
  isMobile,
  getStatusColor,
  getStatusIcon,
  emptyMessage,
  showAccept = false
}) => {
  const theme = useTheme();
  
  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: 3, 
        boxShadow: theme.shadows[1],
        overflowX: 'auto',
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper"
      }}
    >
      <Table sx={{ minWidth: 650 }} size={isMobile ? 'small' : 'medium'}>
        <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
          <TableRow>
            {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Avatar</TableCell>}
            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
            {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>}
            <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id} hover sx={{
              transition: "background 0.2s",
              "&:hover": { bgcolor: "action.selected" }
            }}>
              {!isMobile && (
                <TableCell>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </Avatar>
                </TableCell>
              )}
              <TableCell>
                <Typography fontWeight={600}>
                  {user.firstName} {user.lastName}
                </Typography>
                {isMobile && (
                  <Typography variant="body2" color="text.secondary">
                    @{user.username}
                  </Typography>
                )}
              </TableCell>
              {!isMobile && <TableCell>@{user.username}</TableCell>}
              <TableCell sx={{ textTransform: "capitalize" }}>
                <Chip 
                  label={user.role} 
                  size="small"
                  color={user.role === 'admin' ? 'primary' : 'default'}
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  color={getStatusColor(user.status)}
                  size="small"
                  icon={getStatusIcon(user.status) ?? undefined}
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  {showAccept && onAccept && (
                    <Tooltip title="Accept">
                      <IconButton 
                        color="success" 
                        onClick={() => onAccept(user.id)}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ bgcolor: "success.light", ":hover": { bgcolor: "success.main", color: "#fff" } }}
                      >
                        <CheckCircleIcon fontSize={isMobile ? 'small' : 'medium'} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Edit">
                    <IconButton 
                      color="primary" 
                      onClick={() => onEdit(user)}
                      size={isMobile ? 'small' : 'medium'}
                      sx={{ bgcolor: "primary.light", ":hover": { bgcolor: "primary.main", color: "#fff" } }}
                    >
                      <EditIcon fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      color="error" 
                      onClick={() => onDelete(user)}
                      size={isMobile ? 'small' : 'medium'}
                      sx={{ bgcolor: "error.light", ":hover": { bgcolor: "error.main", color: "#fff" } }}
                    >
                      <DeleteIcon fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={isMobile ? 4 : 6} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserManagementPage;
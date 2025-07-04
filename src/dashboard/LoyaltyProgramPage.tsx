import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Chip, Snackbar, Alert, Divider
} from "@mui/material";
import { Add, Delete, Edit, DirectionsCar, EmojiEvents, People } from "@mui/icons-material";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import AppSidebar from "./AppSidebar";

interface LoyaltyCustomer {
  id?: string;
  name: string;
  cars: { carName: string; plateNumber: string }[];
  points?: number;
}

const LoyaltyProgramPage: React.FC<any> = (props) => {
  // Support both direct props and default to cashier if not provided
  const {
    role = "cashier",
    onLogout,
    onProfile,
    firstName,
    lastName
  } = props;

  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCarFields, setEditCarFields] = useState([{ carName: "", plateNumber: "" }]);
  const [carFields, setCarFields] = useState([{ carName: "", plateNumber: "" }]);
  const [customerName, setCustomerName] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [search, setSearch] = useState("");
  const [carWashCounts, setCarWashCounts] = useState<{ [plate: string]: number }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchCarWashCounts();
  }, []);

  const fetchCustomers = async () => {
    const snapshot = await getDocs(collection(db, "loyalty_customers"));
    setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LoyaltyCustomer[]);
  };

  // Fetch all paid car wash records and count by plate number
  const fetchCarWashCounts = async () => {
    const paymentsSnap = await getDocs(collection(db, "payments"));
    const counts: { [plate: string]: number } = {};
    paymentsSnap.forEach(doc => {
      const data = doc.data();
      if (data.paid && data.plateNumber) {
        const plate = (data.plateNumber as string).toUpperCase();
        counts[plate] = (counts[plate] || 0) + 1;
      }
    });
    setCarWashCounts(counts);
  };

  const handleAddCarField = () => {
    setCarFields([...carFields, { carName: "", plateNumber: "" }]);
  };

  const handleRemoveCarField = (idx: number) => {
    setCarFields(carFields.filter((_, i) => i !== idx));
  };

  const handleCarFieldChange = (idx: number, field: "carName" | "plateNumber", value: string) => {
    setCarFields(fields =>
      fields.map((f, i) => (i === idx ? { ...f, [field]: value } : f))
    );
  };

  const handleAddCustomer = async () => {
    if (!customerName.trim() || carFields.some(c => !c.carName.trim() || !c.plateNumber.trim())) {
      setSnackbar({ open: true, message: "Fill all fields", severity: "error" });
      return;
    }
    try {
      await addDoc(collection(db, "loyalty_customers"), {
        name: customerName,
        cars: carFields,
        points: 0 // initialize points to 0
      });
      setSnackbar({ open: true, message: "Customer registered!", severity: "success" });
      setAddDialogOpen(false);
      setCustomerName("");
      setCarFields([{ carName: "", plateNumber: "" }]);
      fetchCustomers();
      fetchCarWashCounts(); // refresh points
    } catch {
      setSnackbar({ open: true, message: "Failed to register", severity: "error" });
    }
  };

  // Edit logic
  const handleEditClick = (customer: LoyaltyCustomer) => {
    setEditCustomerId(customer.id || null);
    setEditCustomerName(customer.name);
    setEditCarFields(customer.cars.map(car => ({ ...car })));
    setEditDialogOpen(true);
  };

  const handleEditCarFieldChange = (idx: number, field: "carName" | "plateNumber", value: string) => {
    setEditCarFields(fields =>
      fields.map((f, i) => (i === idx ? { ...f, [field]: value } : f))
    );
  };

  const handleEditAddCarField = () => {
    setEditCarFields([...editCarFields, { carName: "", plateNumber: "" }]);
  };

  const handleEditRemoveCarField = (idx: number) => {
    setEditCarFields(editCarFields.filter((_, i) => i !== idx));
  };

  const handleUpdateCustomer = async () => {
    if (!editCustomerName.trim() || editCarFields.some(c => !c.carName.trim() || !c.plateNumber.trim())) {
      setSnackbar({ open: true, message: "Fill all fields", severity: "error" });
      return;
    }
    try {
      await updateDoc(doc(db, "loyalty_customers", editCustomerId!), {
        name: editCustomerName,
        cars: editCarFields
      });
      setSnackbar({ open: true, message: "Customer updated!", severity: "success" });
      setEditDialogOpen(false);
      setEditCustomerId(null);
      setEditCustomerName("");
      setEditCarFields([{ carName: "", plateNumber: "" }]);
      fetchCustomers();
      fetchCarWashCounts();
    } catch {
      setSnackbar({ open: true, message: "Failed to update", severity: "error" });
    }
  };

  // Delete logic (admin only)
  const handleDeleteClick = (customer: LoyaltyCustomer) => {
    setDeleteCustomerId(customer.id || null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerId) return;
    try {
      await deleteDoc(doc(db, "loyalty_customers", deleteCustomerId));
      setSnackbar({ open: true, message: "Customer deleted!", severity: "success" });
      setDeleteDialogOpen(false);
      setDeleteCustomerId(null);
      fetchCustomers();
      fetchCarWashCounts();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete", severity: "error" });
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cars.some(car =>
      car.carName.toLowerCase().includes(search.toLowerCase()) ||
      car.plateNumber.toLowerCase().includes(search.toLowerCase())
    )
  );

  // Stats
  const totalCustomers = customers.length;
  const totalCars = customers.reduce((sum, c) => sum + c.cars.length, 0);
  const topCustomer = customers.reduce((prev, curr) =>
    (curr.points ?? 0) > (prev.points ?? 0) ? curr : prev, { points: 0 } as LoyaltyCustomer
  );

  return (
    <AppSidebar
      role={role}
      onLogout={onLogout}
      onProfile={onProfile}
      firstName={firstName}
      lastName={lastName}
    >
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 2, px: { xs: 1, sm: 2 } }}>
        {/* Stats Section */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #1976d2", bgcolor: "background.paper"
          }}>
            <People color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Customers</Typography>
              <Typography variant="h6" fontWeight={700}>{totalCustomers}</Typography>
            </Box>
          </Paper>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #43a047", bgcolor: "background.paper"
          }}>
            <DirectionsCar color="success" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Cars</Typography>
              <Typography variant="h6" fontWeight={700}>{totalCars}</Typography>
            </Box>
          </Paper>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #fbc02d", bgcolor: "background.paper"
          }}>
            <EmojiEvents color="warning" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Top Customer</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                {topCustomer?.name || "-"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {topCustomer?.points ? `${topCustomer.points.toFixed(2)} pts` : ""}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Header and Register Button */}
        <Paper sx={{
          p: { xs: 2, sm: 3 }, mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between",
          borderRadius: 3, boxShadow: 3, bgcolor: "background.paper"
        }}>
          <Typography variant="h5" fontWeight={700}>Loyalty Program</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              bgcolor: "primary.main",
              ":hover": { bgcolor: "primary.dark" }
            }}
          >
            Register Customer
          </Button>
        </Paper>

        {/* Search Bar */}
        <TextField
          label="Search Customer or Car"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{
            mb: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 1,
            "& .MuiOutlinedInput-root": { borderRadius: 2 }
          }}
        />

        {/* Table */}
        <TableContainer component={Paper} sx={{
          borderRadius: 3,
          boxShadow: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider"
        }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cars</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Points</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map(c => (
                <TableRow
                  key={c.id}
                  hover
                  sx={{
                    transition: "background 0.2s",
                    "&:hover": { bgcolor: "action.selected" }
                  }}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{c.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {c.cars.map((car, idx) => (
                        <Chip
                          key={idx}
                          label={`${car.carName} (${car.plateNumber})`}
                          color="info"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${typeof c.points === "number" ? c.points.toFixed(2) : "0.00"} pts`}
                      color={c.points && c.points > 0 ? "primary" : "default"}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditClick(c)}
                        size="small"
                        title="Edit"
                        sx={{ bgcolor: "primary.light", ":hover": { bgcolor: "primary.main", color: "#fff" } }}
                      >
                        <Edit />
                      </IconButton>
                      {role === "admin" && (
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(c)}
                          size="small"
                          title="Delete"
                          sx={{ bgcolor: "error.light", ":hover": { bgcolor: "error.main", color: "#fff" } }}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      No customers found.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setAddDialogOpen(true)}
                    >
                      Register New Customer
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Register Customer</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Customer Name"
            fullWidth
            margin="normal"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            autoFocus
            inputProps={{ maxLength: 40 }}
            helperText="Enter the full name of the customer"
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Cars</Typography>
          {carFields.map((car, idx) => (
            <Box key={idx} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
              <TextField
                label="Car Name"
                value={car.carName}
                onChange={e => handleCarFieldChange(idx, "carName", e.target.value)}
                sx={{ flex: 1 }}
                inputProps={{ maxLength: 30 }}
                size="small"
              />
              <TextField
                label="Plate Number"
                value={car.plateNumber}
                onChange={e => handleCarFieldChange(idx, "plateNumber", e.target.value)}
                sx={{ flex: 1 }}
                inputProps={{ maxLength: 15 }}
                size="small"
              />
              {carFields.length > 1 && (
                <IconButton onClick={() => handleRemoveCarField(idx)} color="error" size="small">
                  <Delete />
                </IconButton>
              )}
            </Box>
          ))}
          <Button
            startIcon={<Add />}
            onClick={handleAddCarField}
            sx={{ mt: 1, fontWeight: 600 }}
            color="primary"
          >
            Add Another Car
          </Button>
        </DialogContent>
        <Divider sx={{ mt: 2 }} />
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleAddCustomer}>Register</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Customer</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Customer Name"
            fullWidth
            margin="normal"
            value={editCustomerName}
            onChange={e => setEditCustomerName(e.target.value)}
            inputProps={{ maxLength: 40 }}
            helperText="Edit the customer's name"
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Cars</Typography>
          {editCarFields.map((car, idx) => (
            <Box key={idx} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
              <TextField
                label="Car Name"
                value={car.carName}
                onChange={e => handleEditCarFieldChange(idx, "carName", e.target.value)}
                sx={{ flex: 1 }}
                inputProps={{ maxLength: 30 }}
                size="small"
              />
              <TextField
                label="Plate Number"
                value={car.plateNumber}
                onChange={e => handleEditCarFieldChange(idx, "plateNumber", e.target.value)}
                sx={{ flex: 1 }}
                inputProps={{ maxLength: 15 }}
                size="small"
              />
              {editCarFields.length > 1 && (
                <IconButton onClick={() => handleEditRemoveCarField(idx)} color="error" size="small">
                  <Delete />
                </IconButton>
              )}
            </Box>
          ))}
          <Button
            startIcon={<Add />}
            onClick={handleEditAddCarField}
            sx={{ mt: 1, fontWeight: 600 }}
            color="primary"
          >
            Add Another Car
          </Button>
        </DialogContent>
        <Divider sx={{ mt: 2 }} />
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleUpdateCustomer}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Customer Dialog (admin only) */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Customer</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography sx={{ mt: 2, mb: 2 }}>
            Are you sure you want to delete this customer? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteCustomer}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppSidebar>
  );
};

export default LoyaltyProgramPage;

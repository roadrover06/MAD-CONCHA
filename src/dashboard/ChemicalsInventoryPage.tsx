import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, IconButton, Chip, Tooltip, Divider
} from "@mui/material";
import { Add, Edit, Delete, Science, Inventory2 } from "@mui/icons-material";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import AppSidebar from "./AppSidebar";

interface Chemical {
  id?: string;
  name: string;
  stock: number; // in ml
  unit?: string; // e.g. ml, L
  description?: string;
}

const ChemicalsInventoryPage: React.FC<{
  onLogout?: () => void;
  onProfile?: () => void;
  firstName?: string;
  lastName?: string;
}> = ({ onLogout, onProfile, firstName, lastName }) => {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState<Chemical | null>(null);
  const [newChemical, setNewChemical] = useState<{ name: string; stock: number; unit: string; description: string }>({
    name: "",
    stock: 0,
    unit: "ml",
    description: ""
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  useEffect(() => {
    fetchChemicals();
  }, []);

  const fetchChemicals = async () => {
    const snapshot = await getDocs(collection(db, "chemicals"));
    setChemicals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chemical[]);
  };

  const handleAddChemical = async () => {
    try {
      await addDoc(collection(db, "chemicals"), newChemical);
      setSnackbar({ open: true, message: "Chemical added!", severity: "success" });
      setAddDialogOpen(false);
      setNewChemical({ name: "", stock: 0, unit: "ml", description: "" });
      fetchChemicals();
    } catch {
      setSnackbar({ open: true, message: "Failed to add chemical", severity: "error" });
    }
  };

  const handleEditChemical = async () => {
    if (!selectedChemical) return;
    try {
      await updateDoc(doc(db, "chemicals", selectedChemical.id!), {
        name: selectedChemical.name,
        stock: selectedChemical.stock,
        unit: selectedChemical.unit,
        description: selectedChemical.description
      });
      setSnackbar({ open: true, message: "Chemical updated!", severity: "success" });
      setEditDialogOpen(false);
      setSelectedChemical(null);
      fetchChemicals();
    } catch {
      setSnackbar({ open: true, message: "Failed to update chemical", severity: "error" });
    }
  };

  const handleDeleteChemical = async (id: string) => {
    try {
      await deleteDoc(doc(db, "chemicals", id));
      setSnackbar({ open: true, message: "Chemical deleted!", severity: "success" });
      fetchChemicals();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete chemical", severity: "error" });
    }
  };

  // Stats
  const totalChemicals = chemicals.length;
  const totalStock = chemicals.reduce((sum, c) => sum + (c.stock || 0), 0);

  return (
    <AppSidebar role="admin" firstName={firstName} lastName={lastName} onLogout={onLogout} onProfile={onProfile}>
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 2, px: { xs: 1, sm: 2 } }}>
        {/* Stats Section */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #1976d2", bgcolor: "background.paper"
          }}>
            <Science color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Chemicals</Typography>
              <Typography variant="h6" fontWeight={700}>{totalChemicals}</Typography>
            </Box>
          </Paper>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #43a047", bgcolor: "background.paper"
          }}>
            <Inventory2 color="success" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Stock</Typography>
              <Typography variant="h6" fontWeight={700}>{totalStock.toLocaleString()} ml</Typography>
            </Box>
          </Paper>
        </Box>
        {/* Header Section */}
        <Paper sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 3,
          boxShadow: 3,
          bgcolor: "background.paper"
        }}>
          <Typography variant="h5" fontWeight={700}>Chemicals Inventory</Typography>
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
            Add Chemical
          </Button>
        </Paper>
        <TableContainer component={Paper} sx={{
          borderRadius: 3,
          boxShadow: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden"
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chemicals.map(c => (
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
                    <Chip
                      label={`${c.stock.toLocaleString()} ${c.unit || "ml"}`}
                      color={c.stock > 0 ? "primary" : "default"}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography>{c.unit || "ml"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.description || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => { setSelectedChemical(c); setEditDialogOpen(true); }}
                        sx={{ bgcolor: "primary.light", ":hover": { bgcolor: "primary.main", color: "#fff" } }}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDeleteChemical(c.id!)}
                        sx={{ bgcolor: "error.light", ":hover": { bgcolor: "error.main", color: "#fff" } }}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {chemicals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      No chemicals found.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setAddDialogOpen(true)}
                    >
                      Add Chemical
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* Add Chemical Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Add Chemical</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Chemical Name"
            fullWidth
            margin="normal"
            value={newChemical.name}
            onChange={e => setNewChemical({ ...newChemical, name: e.target.value })}
            inputProps={{ maxLength: 40 }}
            helperText="Enter the chemical's name"
            autoFocus
          />
          <TextField
            label="Stock"
            type="number"
            fullWidth
            margin="normal"
            value={newChemical.stock}
            onChange={e => setNewChemical({ ...newChemical, stock: Number(e.target.value) })}
            inputProps={{ min: 0 }}
            helperText="Amount in stock"
          />
          <TextField
            label="Unit"
            fullWidth
            margin="normal"
            value={newChemical.unit}
            onChange={e => setNewChemical({ ...newChemical, unit: e.target.value })}
            placeholder="ml"
            inputProps={{ maxLength: 10 }}
            helperText="e.g. ml, L"
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={newChemical.description}
            onChange={e => setNewChemical({ ...newChemical, description: e.target.value })}
            multiline
            minRows={2}
            inputProps={{ maxLength: 120 }}
            helperText="Optional"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleAddChemical}>Add</Button>
        </DialogActions>
      </Dialog>
      {/* Edit Chemical Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Chemical</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Chemical Name"
            fullWidth
            margin="normal"
            value={selectedChemical?.name || ""}
            onChange={e => setSelectedChemical(selectedChemical ? { ...selectedChemical, name: e.target.value } : null)}
            inputProps={{ maxLength: 40 }}
            helperText="Edit the chemical's name"
            autoFocus
          />
          <TextField
            label="Stock"
            type="number"
            fullWidth
            margin="normal"
            value={selectedChemical?.stock || 0}
            onChange={e => setSelectedChemical(selectedChemical ? { ...selectedChemical, stock: Number(e.target.value) } : null)}
            inputProps={{ min: 0 }}
            helperText="Amount in stock"
          />
          <TextField
            label="Unit"
            fullWidth
            margin="normal"
            value={selectedChemical?.unit || ""}
            onChange={e => setSelectedChemical(selectedChemical ? { ...selectedChemical, unit: e.target.value } : null)}
            placeholder="ml"
            inputProps={{ maxLength: 10 }}
            helperText="e.g. ml, L"
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={selectedChemical?.description || ""}
            onChange={e => setSelectedChemical(selectedChemical ? { ...selectedChemical, description: e.target.value } : null)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 120 }}
            helperText="Optional"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleEditChemical}>Save</Button>
        </DialogActions>
      </Dialog>
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

export default ChemicalsInventoryPage;

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Alert,
  Fade,
  CircularProgress,
  Snackbar,
  Avatar,
  Stack,
  Divider
} from "@mui/material";
import { AccountCircle, Lock, Person } from "@mui/icons-material";
import { saveCredentials } from "../firebase/firestoreHelpers";

interface ProfilePageProps {
  user: {
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack }) => {
  const [username, setUsername] = useState(user.username);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Profile update (username, firstName, lastName)
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // TODO: Replace this with actual Firestore update logic for user profile
      setTimeout(() => {
        setMessage("Profile updated successfully!");
        setLoading(false);
      }, 800);
    } catch (err) {
      setError("Failed to update profile.");
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  // Password update (same logic as RegistrationForm)
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    if (newPassword !== confirmNewPassword) {
      setPwError("Passwords do not match.");
      setSnackbarOpen(true);
      setPwLoading(false);
      return;
    }
    try {
      // Use saveCredentials to update password (username, newPassword, role)
      await saveCredentials(username, newPassword, user.role);
      setPwMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPwError("Failed to change password.");
      setSnackbarOpen(true);
    } finally {
      setPwLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  // Avatar initials
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <Box sx={{
      maxWidth: 520,
      mx: "auto",
      mt: { xs: 3, sm: 6 },
      px: { xs: 1, sm: 0 },
      pb: 6,
      minHeight: "100vh"
    }}>
      {/* Profile Card */}
      <Paper sx={{
        p: { xs: 2, sm: 4 },
        borderRadius: 4,
        mb: 4,
        boxShadow: 6,
        bgcolor: "background.paper",
        position: "relative"
      }}>
        {/* Back Button */}
        <Button
          onClick={onBack}
          size="small"
          sx={{
            position: "absolute",
            left: 16,
            top: 16,
            minWidth: 0,
            px: 1.5,
            py: 0.5,
            fontWeight: 600,
            color: "primary.main",
            bgcolor: "primary.light",
            borderRadius: 2,
            textTransform: "none",
            display: { xs: "none", sm: "inline-flex" }
          }}
        >
          Back
        </Button>
        <Stack direction="column" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{
            width: 80,
            height: 80,
            bgcolor: "#1976d2",
            fontSize: 36,
            fontWeight: 700,
            mb: 1
          }}>
            {initials}
          </Avatar>
          <Typography variant="h5" fontWeight={700}>
            {firstName} {lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{username} &nbsp;|&nbsp; {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Typography>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          Edit Profile
        </Typography>
        <form onSubmit={handleProfileUpdate} autoComplete="off">
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            margin="normal"
            value={username}
            onChange={e => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, borderRadius: 2 }}
            required
            inputProps={{ maxLength: 30, autoComplete: "username" }}
          />
          <TextField
            fullWidth
            label="First Name"
            variant="outlined"
            margin="normal"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, borderRadius: 2 }}
            required
            inputProps={{ maxLength: 30, autoComplete: "given-name" }}
          />
          <TextField
            fullWidth
            label="Last Name"
            variant="outlined"
            margin="normal"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, borderRadius: 2 }}
            required
            inputProps={{ maxLength: 30, autoComplete: "family-name" }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 2, mb: 1, py: 1.2, fontWeight: 600, borderRadius: 2,
              boxShadow: 2, letterSpacing: 0.5
            }}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          {message && (
            <Fade in={!!message}>
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                {message}
              </Alert>
            </Fade>
          )}
        </form>
      </Paper>

      {/* Password Card */}
      <Paper sx={{
        p: { xs: 2, sm: 4 },
        borderRadius: 4,
        boxShadow: 6,
        bgcolor: "background.paper"
      }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          Change Password
        </Typography>
        <form onSubmit={handlePasswordUpdate} autoComplete="off">
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, borderRadius: 2 }}
            required
            inputProps={{ autoComplete: "current-password", maxLength: 30 }}
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, borderRadius: 2 }}
            required
            inputProps={{ autoComplete: "new-password", maxLength: 30 }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={confirmNewPassword}
            onChange={e => setConfirmNewPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, borderRadius: 2 }}
            required
            inputProps={{ autoComplete: "new-password", maxLength: 30 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={pwLoading}
            sx={{
              mt: 2, mb: 1, py: 1.2, fontWeight: 600, borderRadius: 2,
              boxShadow: 2, letterSpacing: 0.5
            }}
            startIcon={pwLoading ? <CircularProgress size={20} /> : undefined}
          >
            {pwLoading ? "Changing..." : "Change Password"}
          </Button>
          {pwMessage && (
            <Fade in={!!pwMessage}>
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                {pwMessage}
              </Alert>
            </Fade>
          )}
        </form>
      </Paper>

      {/* Snackbar for errors */}
      <Snackbar
        open={!!error || !!pwError || snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={handleCloseSnackbar}
          sx={{
            width: "100%",
            borderRadius: 2,
            boxShadow: 3,
            backgroundColor: "#fff",
            color: "#d32f2f",
            "& .MuiAlert-icon": {
              color: "#d32f2f"
            }
          }}
        >
          {error || pwError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;

import React, { useState, useEffect } from "react";
import { getUserByUsername } from "../firebase/firestoreHelpers";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  Alert,
  Fade,
  CircularProgress,
  useMediaQuery,
  Snackbar,
  Link,
  IconButton
} from "@mui/material";
import {
  AccountCircle,
  Lock,
  Login as LoginIcon,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";
import logo from '../assets/logos/carwash-logo.png';
// @ts-ignore
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";

// Array of high-quality car images for the right side
const carImages = [
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
];

// Add UserDoc interface to match Firestore user document structure
interface UserDoc {
  id: string;
  username: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
  status?: string; // <-- add status
}

interface LoginFormProps {
  onCreateAccount?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordAlertOpen, setForgotPasswordAlertOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');
  const isXs = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();

  useEffect(() => {
    // Change image every 6 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole === "admin") navigate("/admin");
    if (storedRole === "cashier") navigate("/cashier");
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setForgotPasswordAlertOpen(false); // <-- Ensure forgot password alert is closed on login
  try {
    // Fetch user data from Firestore first
    const userDocRaw = await getUserByUsername(username);
    if (!userDocRaw) {
      setError("Invalid credentials. Please try again.");
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    const userDoc = userDocRaw as UserDoc;

    // Handle different statuses
    if (userDoc.status === "pending") {
      setError("Your account is still pending approval. Please wait for an administrator to activate your account.");
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }
    if (userDoc.status === "disabled") {
      setError("Your account has been disabled. Please contact the administrator for assistance.");
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }
    if (userDoc.status && userDoc.status !== "active") {
      setError(`Your account status is "${userDoc.status}". Please contact the administrator.`);
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    // Use bcryptjs to verify password
    const passwordMatch = await new Promise<boolean>((resolve) => {
      bcrypt.compare(password, userDoc.password, (err, res) => {
        resolve(res === true);
      });
    });

    // Debug logging - remove after testing
    console.log("Stored password hash:", userDoc.password);
    console.log("Input password:", password);
    console.log("Password match result:", passwordMatch);

    if (!passwordMatch) {
      setError("Invalid credentials. Please try again.");
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    // Save to localStorage for protected routes
    localStorage.setItem("role", userDoc.role);
    localStorage.setItem("userInfo", JSON.stringify({
      username: userDoc.username,
      firstName: userDoc.firstName || "",
      lastName: userDoc.lastName || "",
      role: userDoc.role
    }));
    setMessage("");
    // Navigate to dashboard after login
    if (userDoc.role === "admin") navigate("/admin");
    else if (userDoc.role === "cashier") navigate("/cashier");
  } catch (err) {
    console.error("Login error:", err);
    setError("An error occurred during login. Please try again.");
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
  }
};

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  // Stepper logic for UX (optional, just visual)
  const step = username && password ? 2 : username ? 1 : 0;

  const handleForgotPassword = () => {
    setForgotPasswordAlertOpen(true);
  };

  const handleCloseForgotPasswordAlert = () => {
    setForgotPasswordAlertOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        position: 'relative',
        background: 'linear-gradient(120deg, #f5f5f5 60%, #ffeaea 100%)',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: -120,
          left: -120,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 60% 40%, #ffbaba 0%, #fff0 80%)',
          zIndex: 0,
          filter: 'blur(8px)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 60%, #ffd6d6 0%, #fff0 80%)',
          zIndex: 0,
          filter: 'blur(12px)'
        }}
      />

      {/* Left side - Login Form */}
      <Box
        sx={{
          width: isMobile ? '100%' : '50%',
          minHeight: isMobile ? 'auto' : '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: isXs ? 2 : isMobile ? 4 : 8,
          py: isXs ? 4 : isMobile ? 6 : 0,
          position: 'relative',
          zIndex: 2,
          background: isMobile ? 'rgba(255,255,255,0.95)' : 'transparent'
        }}
      >
        {/* Vertical accent bar for desktop */}
        {!isMobile && (
          <Box sx={{
            position: 'absolute',
            left: 0,
            top: '10%',
            height: '80%',
            width: 6,
            borderRadius: 3,
            background: 'linear-gradient(180deg, #d32f2f 0%, #ff6b6b 100%)',
            boxShadow: '0 0 16px 2px #ffbaba44',
            zIndex: 3
          }} />
        )}

        {/* Shop logo and name */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <Box
            component="img"
            src={logo}
            alt="MAD Auto Care Services"
            sx={{
              height: isXs ? 48 : isMobile ? 60 : 80,
              mb: 2,
              filter: 'drop-shadow(0 2px 8px rgba(211,47,47,0.10))',
              borderRadius: 2,
              background: '#fff',
              p: 1
            }}
          />
          <Typography
            variant={isXs ? "h5" : "h4"}
            sx={{
              fontWeight: 800,
              letterSpacing: 1,
              color: '#d32f2f',
              mb: 0.5,
              textShadow: '0 2px 8px #fff8'
            }}
          >
            MAD AUTO CARE SERVICES
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: '#555',
              mb: 3,
              fontWeight: 400,
              fontSize: isXs ? '0.95rem' : '1.05rem'
            }}
          >
            Premium Car Care Solutions
          </Typography>
        </motion.div>

        {/* Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ width: '100%', maxWidth: 340 }} // reduced from 420
        >
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              p: isXs ? 1.5 : isMobile ? 2 : 2.5, // reduced padding
              borderRadius: 3,
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px 0 rgba(211,47,47,0.08), 0 1.5px 8px 0 rgba(0,0,0,0.04)',
              border: '1.5px solid rgba(211,47,47,0.08)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Stepper indicator */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              {[0, 1].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 20, // smaller
                    height: 5,
                    borderRadius: 2,
                    mx: 0.5,
                    background: step > i
                      ? 'linear-gradient(90deg, #d32f2f 0%, #ff6b6b 100%)'
                      : '#eee',
                    transition: 'background 0.3s'
                  }}
                />
              ))}
            </Box>

            <Typography
              variant="h6" // smaller
              component="h1"
              sx={{
                mb: 1.5,
                textAlign: 'center',
                fontWeight: 700,
                color: '#222',
                fontFamily: '"Poppins", sans-serif',
                fontSize: isXs ? '1.1rem' : '1.18rem'
              }}
            >
              Sign in to your account
            </Typography>

            <form onSubmit={handleLogin} autoComplete="off">
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1.2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.95)'
                  }
                }}
                required
                autoFocus
                size="small"
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  mb: 0.7,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.95)'
                  }
                }}
                required
                size="small"
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.2 }}>
                <Link
                  component="button"
                  type="button" // <-- Prevent form submit on click
                  onClick={handleForgotPassword}
                  sx={{
                    fontSize: '0.92rem',
                    color: '#d32f2f',
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  fullWidth
                  size="medium"
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} /> : <LoginIcon />}
                  sx={{
                    mt: 0.5,
                    py: 1.1,
                    borderRadius: 2,
                    fontSize: '0.98rem',
                    background: 'linear-gradient(90deg, #d32f2f 0%, #ff6b6b 100%)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #b71c1c 0%, #ff5252 100%)',
                    },
                    boxShadow: '0 4px 12px rgba(211,47,47,0.10)',
                    textTransform: 'none',
                    fontWeight: 700,
                    letterSpacing: 0.3
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </motion.div>

              {message && (
                <Fade in={!!message}>
                  <Alert
                    severity="success"
                    sx={{
                      mt: 1.2,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      fontSize: '0.97rem'
                    }}
                  >
                    {message}
                  </Alert>
                </Fade>
              )}
            </form>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.97rem' }}>
                Don't have an account?{' '}
                <Link
                  component="button"
                  onClick={() => navigate("/register")}
                  sx={{
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#d32f2f',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Create Account
                </Link>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Box>

      {/* Right side - Car Images Carousel with overlay */}
      {!isMobile && (
        <Box
          sx={{
            width: '50%',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Carousel images */}
          {carImages.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{
                opacity: index === currentImageIndex ? 1 : 0,
                transition: { duration: 1 }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 1
              }}
            />
          ))}
          {/* Overlay gradient */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(120deg, rgba(0,0,0,0.45) 60%, rgba(211,47,47,0.18) 100%)',
              zIndex: 2
            }}
          />
          {/* Branding overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 48,
              left: 48,
              zIndex: 3,
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: 1, textShadow: '0 2px 12px #0008' }}>
              MAD AUTO CARE SERVICES
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, textShadow: '0 1px 8px #0007' }}>
              Premium Car Care Solutions
            </Typography>
          </Box>
          {/* Carousel dots */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 32,
              left: 48,
              zIndex: 4,
              display: 'flex',
              gap: 1
            }}
          >
            {carImages.map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: idx === currentImageIndex ? '#fff' : '#fff7',
                  border: idx === currentImageIndex ? '2px solid #d32f2f' : '2px solid #fff7',
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Snackbar for errors */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 6 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert
            severity="error"
            onClose={handleCloseSnackbar}
            sx={{
              width: '100%',
              borderRadius: 2,
              boxShadow: 3,
              backgroundColor: '#fff',
              color: '#d32f2f',
              '& .MuiAlert-icon': {
                color: '#d32f2f'
              }
            }}
          >
            {error}
          </Alert>
        </motion.div>
      </Snackbar>

      {/* Snackbar for forgot password alert */}
      {forgotPasswordAlertOpen && (
        <Snackbar
          open={forgotPasswordAlertOpen}
          autoHideDuration={6000}
          onClose={handleCloseForgotPasswordAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 6 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert
              severity="info"
              onClose={handleCloseForgotPasswordAlert}
              sx={{
                width: '100%',
                borderRadius: 2,
                boxShadow: 3,
                backgroundColor: '#fff',
                color: '#1976d2',
                '& .MuiAlert-icon': {
                  color: '#1976d2'
                }
              }}
            >
              Please contact the administrator to change your password.
            </Alert>
          </motion.div>
        </Snackbar>
      )}
    </Box>
  );
};

export default LoginForm;
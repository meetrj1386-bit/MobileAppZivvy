// app/reset-password.js
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from './supabaseClient';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [errors, setErrors] = useState({});
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: '',
    message: '',
    buttonText: 'Continue',
    onClose: () => {}
  });

  useEffect(() => {
    // Handle the token from the email link
    handleEmailToken();
  }, [params]);

  const handleEmailToken = async () => {
    try {
      const { token, type } = params;
      
      if (token && type === 'recovery') {
        // Verify the recovery token with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });
        
        if (error) {
          // Still use Alert for error cases, but you could create an ErrorModal too
          Alert.alert(
            'Invalid Link',
            'This password reset link is invalid or has expired. Please request a new one.',
            [{ text: 'OK', onPress: () => router.replace('/welcome') }]
          );
        }
      }
    } catch (error) {
      console.error('Token verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    // Clear previous errors
    setErrors({});
    const newErrors = {};
    
    // Validate fields with inline errors
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Sign out after password reset to ensure clean state
      await supabase.auth.signOut();
      
      // Show success modal instead of Alert
      setSuccessModal({
        visible: true,
        title: 'Password Reset! 🎉',
        message: 'Your password has been successfully updated. Please sign in with your new password.',
        buttonText: 'Go to Sign In',
        onClose: () => {
          setSuccessModal({ ...successModal, visible: false });
          router.replace('/welcome');
        }
      });
    }
  };

  if (verifying) {
    return (
      <LinearGradient colors={['#faf8f5', '#e5d9cc']} style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#6b5b95" />
          <Text style={styles.subtitle}>Verifying reset link...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#faf8f5', '#e5d9cc']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Zivvy</Text>
        </View>
        
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.newPassword && styles.inputError]}
            placeholder="New Password (min 6 characters)"
            placeholderTextColor="rgba(107, 91, 149, 0.4)"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (errors.newPassword) {
                setErrors({ ...errors, newPassword: null });
              }
            }}
            secureTextEntry
            autoCapitalize="none"
          />
          {errors.newPassword && (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Confirm Password"
            placeholderTextColor="rgba(107, 91, 149, 0.4)"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) {
                setErrors({ ...errors, confirmPassword: null });
              }
            }}
            secureTextEntry
            autoCapitalize="none"
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleResetPassword}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#6b5b95', '#8073a3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Reset Password</Text>
                <View style={styles.arrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/welcome')}
        >
          <Text style={styles.backButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal - commented out until component is created
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        buttonText={successModal.buttonText}
        onClose={successModal.onClose}
      />
      */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 44,
    fontWeight: '600',
    color: '#6b5b95',
    letterSpacing: 0.5,
    fontFamily: 'Quicksand',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6b5b95',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Quicksand',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(107, 91, 149, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Poppins-Medium',
  },
  inputContainer: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#3a3548',
    borderWidth: 1,
    borderColor: 'rgba(107, 91, 149, 0.2)',
    fontFamily: 'Poppins-Medium',
  },
  inputError: {
    borderColor: '#d4a574',
    borderWidth: 2,
  },
  errorText: {
    color: '#d4a574',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
    fontFamily: 'Poppins-Medium',
  },
  button: {
    marginTop: 16,
    shadowColor: '#6b5b95',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 999,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginRight: 8,
  },
  arrow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6b5b95',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'Poppins-Medium',
  },
});
// app/welcome.js — Zivvy onboarding - COMPLETE WORKING VERSION
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SuccessModal from '../components/SuccessModal';
import { supabase } from './supabaseClient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/* ------------------------------ Brand tokens ------------------------------ */
const APP_NAME = 'Zivvy';
const BACKGROUND_GRADIENT = ['#faf8f5', '#e5d9cc'];
const PRIMARY_PURPLE = '#6b5b95';
const SAGE_GREEN = '#87a08e';
const WARM_TAN = '#d4a574';
const TEXT_DARK = '#3a3548';
const TEXT_MID = 'rgba(107, 91, 149, 0.7)';
const TEXT_SOFT = 'rgba(107, 91, 149, 0.55)';
const CARD_BG = 'rgba(255, 255, 255, 0.85)';
const CARD_BORDER = 'rgba(107, 91, 149, 0.15)';
const FLOW_GRADIENT = ['#faf8f5', '#e5d9cc'];

/* -------------------------------- Slide 1 --------------------------------- */
const Slide1 = ({ scrollToSlide }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.slide}>
      <LinearGradient
        colors={FLOW_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.heroWrapper}>
          <Animated.View 
            style={[
              styles.squircleContainer,
              { transform: [{ translateY: floatAnim }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(250, 248, 245, 0.9)', 'rgba(245, 242, 237, 0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.squircle}
            >
              <LottieView
                source={require('../assets/animations/family-love.json')}
                autoPlay
                loop
                style={styles.lottieInSquircle}
              />
            </LinearGradient>
          </Animated.View>

          <View style={styles.textGroup}>
            <Text style={styles.brandTitle}>Zivvy</Text>
            <Text style={styles.mainTagline}>
              Making Parenting Paths Simple
            </Text>
            <Text style={styles.subTagline}>
              Tiny daily actions • Big lifelong progress
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => scrollToSlide(1)}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={[PRIMARY_PURPLE, '#8073a3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Get Started</Text>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.trustRow}>
          🔒 Private  •  ✨ Ad-Free  •  💜 Expert-Built
        </Text>
      </LinearGradient>
    </View>
  );
};

/* -------------------------------- Slide 2 --------------------------------- */
const Slide2 = ({ scrollToSlide }) => (
  <View style={styles.slide}>
    <LinearGradient 
      colors={FLOW_GRADIENT}
      start={{ x: 0, y: 0 }} 
      end={{ x: 0, y: 1 }} 
      style={styles.gradientBackground}
    >
      <View style={styles.slide2Content}>
        <Text style={styles.slideTitle}>How it Works</Text>
        <Text style={styles.slide2Subtitle}>Three simple steps to success</Text>

        <View style={styles.stepsContainer}>
          {[
            { 
              title: 'You Lead', 
              desc: 'Guide your child\'s progress with confidence', 
              icon: '👨‍👩‍👧',
              color: 'rgba(107, 91, 149, 0.15)'
            },
            { 
              title: 'Smart Schedule', 
              desc: 'Fits perfectly around your daily routine', 
              icon: '📅',
              color: 'rgba(135, 160, 142, 0.15)'
            },
            { 
              title: 'Watch Them Grow', 
              desc: 'Celebrate small wins that add up big', 
              icon: '✨',
              color: 'rgba(212, 165, 116, 0.15)'
            },
          ].map((step, i) => (
            <View key={`step-${i}`} style={styles.stepCard}>
              <View style={[styles.iconCircle, { backgroundColor: step.color }]}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.ctaWrapper}
        onPress={() => scrollToSlide(2)} 
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[PRIMARY_PURPLE, '#8073a3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaText}>Continue</Text>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  </View>
);

/* -------------------------------- Slide 3 --------------------------------- */
const Slide3 = ({ authMode, formData, setFormData, loading, handleSignIn, handleSignUp, setAuthMode, errors, setErrors }) => {
  if (!formData) return <View style={styles.slide}><Text>Loading…</Text></View>;

  const isSignIn = authMode === 'signin';

  return (
    <View style={styles.slide}>
      <LinearGradient 
        colors={FLOW_GRADIENT}
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }} 
        style={styles.gradientBackground}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.authScrollView}
          contentContainerStyle={styles.authScrollContent}
        >
          <View style={styles.authLogoContainer}>
            <View style={styles.smallSquircle}>
              <LottieView
                source={require('../assets/animations/family-love.json')}
                autoPlay
                loop
                style={styles.smallLottie}
              />
            </View>
          </View>

          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>
              {isSignIn ? 'Welcome to Zivvy' : 'Join Zivvy'}
            </Text>
            <Text style={styles.authSubtitle}>
              {isSignIn
                ? 'Sign in to continue your journey'
                : 'Start building better routines today'}
            </Text>
          </View>

          <View style={styles.authFormContainer}>
            {/* Name field FIRST for Sign Up */}
            {!isSignIn && (
              <>
                <TextInput
                  style={[styles.inputField, errors.parentName && styles.inputFieldError]}
                  placeholder="Your Name *"
                  placeholderTextColor="rgba(107, 91, 149, 0.4)"
                  value={formData.parentName}
                  onChangeText={(t) => {
                    setFormData({ ...formData, parentName: t });
                    setErrors({ ...errors, parentName: null });
                  }}
                  autoCapitalize="words"
                />
                {errors.parentName && (
                  <Text style={styles.errorText}>{errors.parentName}</Text>
                )}
              </>
            )}

            <TextInput
              style={[styles.inputField, errors.email && styles.inputFieldError]}
              placeholder={isSignIn ? "Email" : "Email *"}
              placeholderTextColor="rgba(107, 91, 149, 0.4)"
              value={formData.email}
              onChangeText={(t) => {
                setFormData({ ...formData, email: t });
                setErrors({ ...errors, email: null });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <TextInput
              style={[styles.inputField, errors.password && styles.inputFieldError]}
              placeholder={isSignIn ? "Password" : "Password * (min 6 characters)"}
              placeholderTextColor="rgba(107, 91, 149, 0.4)"
              value={formData.password}
              onChangeText={(t) => {
                setFormData({ ...formData, password: t });
                setErrors({ ...errors, password: null });
              }}
              secureTextEntry
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Forgot Password - only show on Sign In */}
            {isSignIn && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => {
                  if (!formData.email) {
                    setErrors({ email: 'Please enter your email address first' });
                    return;
                  }
                  
                  // Show custom modal instead of Alert
                  setSuccessModal({
                    visible: true,
                    title: 'Reset Password?',
                    message: `We'll send password reset instructions to ${formData.email}`,
                    buttonText: 'Send Reset Link',
                    onClose: async () => {
                      setSuccessModal(prev => ({ ...prev, visible: false }));
                      
                      const { error } = await supabase.auth.resetPasswordForEmail(
                        formData.email.toLowerCase().trim(),
                        {
                          redirectTo: 'zivvy://reset-password',
                        }
                      );
                      
                      if (!error) {
                        // Show success message
                        setTimeout(() => {
                          setSuccessModal({
                            visible: true,
                            title: 'Check Your Email 📧',
                            message: 'We sent you a password reset link. Click the link in the email to reset your password.',
                            buttonText: 'OK',
                            onClose: () => {
                              setSuccessModal(prev => ({ ...prev, visible: false }));
                            }
                          });
                        }, 300);
                      } else {
                        // Show error inline instead of Alert
                        setErrors({ email: error.message });
                      }
                    }
                  });
                }}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Terms checkbox - only show on Sign Up */}
            {!isSignIn && (
              <TouchableOpacity 
                style={styles.termsContainer}
                onPress={() => setFormData({ ...formData, agreedToTerms: !formData.agreedToTerms })}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxNew, formData.agreedToTerms && styles.checkboxChecked]}>
                  {formData.agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsTextNew}>
                  I agree to the Terms of Service and Privacy Policy
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.authButton, loading && { opacity: 0.7 }]}
            onPress={isSignIn ? handleSignIn : handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[PRIMARY_PURPLE, '#8073a3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.authButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.authButtonText}>
                    {isSignIn ? 'Sign In' : 'Create Account'}
                  </Text>
                  <View style={styles.authArrow}>
                    <Text style={styles.authArrowText}>→</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAuthMode(isSignIn ? 'signup' : 'signin')}
            style={styles.switchContainer}
          >
            <Text style={styles.switchText}>
              {isSignIn ? "New here? " : "Already have an account? "}
              <Text style={styles.switchTextBold}>
                {isSignIn ? "Create Account" : "Sign In"}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

/* ------------------------------ Main component ---------------------------- */
export default function WelcomeScreen() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [authMode, setAuthMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: '',
    message: '',
    buttonText: 'Continue',
    onClose: () => {}
  });

  const [fontsLoaded] = useFonts({
    "Poppins-Bold": require('../assets/fonts/Poppins-Bold.ttf'),
    "Poppins-SemiBold": require('../assets/fonts/Poppins-SemiBold.ttf'),
    "Poppins-Medium": require('../assets/fonts/Poppins-Medium.ttf'),
    "Quicksand": require('../assets/fonts/Quicksand-VariableFont_wght.ttf'),
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    parentName: '',
    agreedToTerms: false,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf8f5' }}>
        <ActivityIndicator size="large" color={PRIMARY_PURPLE} />
      </View>
    );
  }

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentSlide(slideIndex);
  };

  const scrollToSlide = (index) => {
    scrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    setCurrentSlide(index);
  };

  const handleSignIn = async () => {
    const signInErrors = {};
    
    if (!formData.email) {
      signInErrors.email = 'Email is required';
    }
    if (!formData.password) {
      signInErrors.password = 'Password is required';
    }
    
    if (Object.keys(signInErrors).length > 0) {
      setErrors(signInErrors);
      return;
    }
    
    setErrors({});
    
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        Alert.alert(
          'Sign In Failed', 
          'Incorrect email or password. Please try again.',
          [
            { text: 'Try Again', style: 'default' },
            { 
              text: 'Reset Password', 
              onPress: async () => {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                  formData.email.toLowerCase().trim()
                );
                if (!resetError) {
                  Alert.alert(
                    'Password Reset Sent',
                    'Check your email for reset instructions.'
                  );
                }
              }
            }
          ]
        );
        return;
      }
      
      if (error.message.includes('Email not confirmed')) {
        Alert.alert(
          'Email Not Verified',
          'Please check your email and verify your account first.',
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Resend Email',
              onPress: async () => {
                const { error: resendError } = await supabase.auth.resend({
                  type: 'signup',
                  email: formData.email.toLowerCase().trim(),
                });
                if (!resendError) {
                  Alert.alert('Email Sent', 'Verification email has been resent.');
                }
              }
            }
          ]
        );
        return;
      }
      
      Alert.alert('Sign In Failed', error.message);
      return;
    }
    
    if (data.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      await AsyncStorage.setItem('userEmail', data.user.email);
      if (profile?.parent_name) {
        await AsyncStorage.setItem('userName', profile.parent_name);
      }
      
      router.replace('/calendar-form');
    }
  };

  const handleSignUp = async () => {
    const newErrors = {};
    
    if (!formData.parentName) {
      newErrors.parentName = 'Name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.agreedToTerms) {
      newErrors.terms = 'Please agree to the Terms of Service';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.terms) {
        Alert.alert('Terms Required', newErrors.terms);
      }
      return;
    }
    
    setErrors({});

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      options: {
        data: {
          parent_name: formData.parentName,
          agreed_to_terms: true,
          agreed_at: new Date().toISOString(),
        },
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        Alert.alert(
          'Account Already Exists',
          `An account with ${formData.email} already exists. Would you like to sign in instead?`,
          [
            {
              text: 'Sign In',
              onPress: () => {
                setAuthMode('signin');
                setFormData({...formData, password: ''});
              }
            },
            {
              text: 'Reset Password',
              onPress: async () => {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                  formData.email.toLowerCase().trim()
                );
                
                if (!resetError) {
                  Alert.alert(
                    'Password Reset Email Sent',
                    'Check your email for instructions to reset your password.',
                    [{ text: 'OK', onPress: () => setAuthMode('signin') }]
                  );
                } else {
                  Alert.alert('Error', resetError.message);
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    if (data.user) {
      await supabase.from('user_profiles').insert({
        user_id: data.user.id,
        email: formData.email,
        parent_name: formData.parentName,
        created_at: new Date().toISOString(),
      });

      await AsyncStorage.setItem('userEmail', data.user.email);
      await AsyncStorage.setItem('userName', formData.parentName);

      // Show success modal instead of Alert
      setSuccessModal({
        visible: true,
        title: 'Welcome to Zivvy! 🎉',
        message: 'Your account is ready! Please check your email to verify your account.',
        buttonText: 'Start Using Zivvy',
        onClose: () => {
          setSuccessModal(prev => ({ ...prev, visible: false }));
          router.replace('/calendar-form');
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Slide1 scrollToSlide={scrollToSlide} />
        <Slide2 scrollToSlide={scrollToSlide} />
        <Slide3
          authMode={authMode}
          formData={formData}
          setFormData={setFormData}
          loading={loading}
          handleSignIn={handleSignIn}
          handleSignUp={handleSignUp}
          setAuthMode={setAuthMode}
          errors={errors}
          setErrors={setErrors}
        />
      </ScrollView>

      <View style={styles.dotsWrap}>
        {[0, 1, 2].map((i) => (
          <View
            key={`dot-${i}`}
            style={[styles.dot, currentSlide === i && styles.dotActive]}
          />
        ))}
      </View>

      {/* Success Modal */}
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        buttonText={successModal.buttonText}
        onClose={successModal.onClose}
      />
    </View>
  );
}

/* ---------------------------------- Styles --------------------------------- */
const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  
  slide: { 
    width: screenWidth, 
    height: screenHeight 
  },
  
  gradientBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: '#f5efea',
  },

  /* ========== Slide 1 Styles ========== */
  squircleContainer: {
    marginBottom: 40,
    shadowColor: PRIMARY_PURPLE,
    shadowOpacity: 0.12,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
 
  squircle: {
    width: 180,
    height: 180,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(135, 160, 142, 0.3)',
  },

  lottieInSquircle: {
    width: 140,
    height: 140,
  },

  heroWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textGroup: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  brandTitle: {
    fontSize: 44,
    fontWeight: '600',
    color: PRIMARY_PURPLE,
    letterSpacing: 0.5,
    marginBottom: 20,
    fontFamily: 'Quicksand',
    textShadowColor: 'rgba(107, 91, 149, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 54,
    paddingVertical: 4,
  },

  mainTagline: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_DARK,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  
  subTagline: {
    fontSize: 16,
    color: TEXT_MID,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },
  
  ctaWrapper: {
    marginBottom: 24,
    shadowColor: PRIMARY_PURPLE,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingLeft: 48,
    paddingRight: 42,
    borderRadius: 999,
  },
  
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  arrow: {
    marginLeft: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  arrowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  
  trustRow: {
    fontSize: 14,
    color: TEXT_SOFT,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 60,
  },

  /* ========== Slide 2 Styles ========== */
  slide2Content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingTop: 40,
  },

  slideTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: PRIMARY_PURPLE,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Quicksand',
  },
  
  slide2Subtitle: {
    fontSize: 16,
    color: TEXT_MID,
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Poppins-Medium',
  },
  
  stepsContainer: { 
    width: '100%', 
    paddingHorizontal: 0,
  },

  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  stepIcon: { 
    fontSize: 28,
  },
  
  stepTextContainer: {
    flex: 1,
  },
  
  stepTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: PRIMARY_PURPLE,
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  
  stepDesc: { 
    fontSize: 14, 
    color: TEXT_MID,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',
  },

  /* ========== Slide 3 Styles ========== */
  authScrollView: {
    flex: 1,
    width: '100%',
  },
  
  authScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },

  authLogoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },

  smallSquircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(250, 248, 245, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(135, 160, 142, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallLottie: {
    width: 70,
    height: 70,
  },

  authHeader: { 
    width: '100%', 
    marginBottom: 32,
    alignItems: 'center',
  },

  authTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: PRIMARY_PURPLE,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Quicksand',
  },

  authSubtitle: { 
    fontSize: 16, 
    color: TEXT_MID,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },

  authFormContainer: { 
    width: '100%',
    marginBottom: 24,
  },

  inputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: TEXT_DARK,
    borderWidth: 1,
    borderColor: 'rgba(107, 91, 149, 0.2)',
    marginBottom: 14,
    fontFamily: 'Poppins-Medium',
  },

  inputFieldError: {
    borderColor: '#d4a574',
    borderWidth: 2,
  },

  errorText: {
    color: '#d4a574',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 12,
    fontFamily: 'Poppins-Medium',
  },

  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: -8,
    marginBottom: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  forgotPasswordText: {
    color: PRIMARY_PURPLE,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'Poppins-Medium',
  },

  termsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  checkboxNew: {
    width: 24, 
    height: 24, 
    borderRadius: 8,
    borderWidth: 2, 
    borderColor: '#6b5b95',
    marginRight: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },

  checkboxChecked: { 
    backgroundColor: '#6b5b95',
    borderColor: '#6b5b95',
  },

  checkmark: { 
    color: '#FFFFFF', 
    fontWeight: '800',
    fontSize: 14,
  },

  termsTextNew: { 
    color: TEXT_MID, 
    fontSize: 14, 
    flex: 1,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',
  },

  authButton: {
    marginBottom: 20,
    shadowColor: PRIMARY_PURPLE,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  authButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 999,
  },

  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginRight: 8,
  },

  authArrow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  authArrowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  switchContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  switchText: { 
    color: TEXT_MID, 
    fontSize: 15,
    textAlign: 'center',
  },

  switchTextBold: {
    color: PRIMARY_PURPLE,
    fontWeight: '700',
  },

  /* ========== Pagination ========== */
  dotsWrap: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: 'rgba(107, 91, 149, 0.25)' 
  },
  
  dotActive: { 
    backgroundColor: PRIMARY_PURPLE, 
    width: 10, 
    height: 10,
    borderRadius: 5,
  },
});
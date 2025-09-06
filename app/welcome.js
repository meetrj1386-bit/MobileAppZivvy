// app/welcome.js — Zivvy onboarding - UPDATED THEME VERSION
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import LottieView from 'lottie-react-native';
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/* ------------------------------ Brand tokens - UPDATED THEME ------------------------------ */
const APP_NAME = 'Zivvy';

// New theme colors
const BACKGROUND_GRADIENT = ['#faf8f5', '#e5d9cc'];  // Very pronounced warm gradient for visibility
const PRIMARY_PURPLE = '#6b5b95';  // Main purple accent
const SAGE_GREEN = '#87a08e';      // Secondary sage green
const WARM_TAN = '#d4a574';        // Accent warm tan

// Text colors derived from theme
const TEXT_DARK = '#3a3548';       // Darker version of purple for text
const TEXT_MID = 'rgba(107, 91, 149, 0.7)';  // Purple with opacity
const TEXT_SOFT = 'rgba(107, 91, 149, 0.55)'; // Softer purple

// UI elements
const CARD_BG = 'rgba(255, 255, 255, 0.85)';
const CARD_BORDER = 'rgba(107, 91, 149, 0.15)';
const FLOW_GRADIENT = ['#faf8f5', '#e5d9cc'];  // Same as background for consistency

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
          {/* Soft rounded square container */}
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

          {/* Text content */}
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

        {/* CTA Button */}
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
              color: 'rgba(107, 91, 149, 0.15)'  // Purple tint
            },
            { 
              title: 'Smart Schedule', 
              desc: 'Fits perfectly around your daily routine', 
              icon: '📅',
              color: 'rgba(135, 160, 142, 0.15)'  // Sage green tint
            },
            { 
              title: 'Watch Them Grow', 
              desc: 'Celebrate small wins that add up big', 
              icon: '✨',
              color: 'rgba(212, 165, 116, 0.15)'  // Warm tan tint
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

const Slide3 = ({ authMode, formData, setFormData, loading, handleSignIn, handleSignUp, setAuthMode }) => {
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
          {/* Logo/Brand at top */}
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

          {/* Auth Header */}
          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>
              {isSignIn ? 'Welcome Back' : 'Join Zivvy'}
            </Text>
            <Text style={styles.authSubtitle}>
              {isSignIn
                ? 'Continue your parenting journey'
                : 'Start building better routines today'}
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.authFormContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Email"
              placeholderTextColor="rgba(107, 91, 149, 0.4)"
              value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.inputField}
              placeholder="Password"
              placeholderTextColor="rgba(107, 91, 149, 0.4)"
              value={formData.password}
              onChangeText={(t) => setFormData({ ...formData, password: t })}
              secureTextEntry
            />

            {!isSignIn && (
              <>
                <TextInput
                  style={styles.inputField}
                  placeholder="Your Name"
                  placeholderTextColor="rgba(107, 91, 149, 0.4)"
                  value={formData.parentName}
                  onChangeText={(t) => setFormData({ ...formData, parentName: t })}
                />

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
              </>
            )}
          </View>

          {/* Submit Button */}
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

          {/* Switch Auth Mode */}
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

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    // Loading multiple font options
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

  // Check fonts loaded AFTER all hooks are declared
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
    if (!formData.email || !formData.password) {
      Alert.alert('Missing Info', 'Please enter email and password');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error.message);
      return;
    }
    if (data.user) {
      await AsyncStorage.setItem('userEmail', data.user.email);
      await supabase.from('user_profiles').select('*').eq('user_id', data.user.id).single();
      router.replace('/calendar-form');
    }
  };

  const handleSignUp = async () => {
    if (!formData.agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service');
      return;
    }
    if (!formData.email || !formData.password || !formData.parentName) {
      Alert.alert('Missing Info', 'Please fill all fields');
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

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

      Alert.alert(
        `Welcome to ${APP_NAME}!`,
        'Please check your email to verify your account, then sign in.',
        [{ text: 'OK', onPress: () => setAuthMode('signin') }]
      );
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
        />
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.dotsWrap}>
        {[0, 1, 2].map((i) => (
          <View
            key={`dot-${i}`}
            style={[styles.dot, currentSlide === i && styles.dotActive]}
          />
        ))}
      </View>
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
    backgroundColor: '#f5efea', // Warm beige as fallback
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
    borderColor: 'rgba(135, 160, 142, 0.3)',  // Sage green border
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

  heartContainer: {
    width: 200,
    height: 180,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  heartShape: {
    position: 'absolute',
    width: 200,
    height: 180,
  },
  
  heartLeft: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
    top: 0,
    left: 25,
    transform: [{ rotate: '-45deg' }],
    shadowColor: PRIMARY_PURPLE,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  
  heartRight: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
    top: 0,
    right: 25,
    transform: [{ rotate: '45deg' }],
    shadowColor: PRIMARY_PURPLE,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  
  heartBottom: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    transform: [{ rotate: '45deg' }],
    bottom: 10,
    left: 50,
  },
  
  lottieInHeart: {
    width: 140,
    height: 140,
    position: 'absolute',
    zIndex: 1,
  },

  lottieDirectContainer: {
    marginBottom: 40,
    shadowColor: PRIMARY_PURPLE,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  
  lottieDirect: {
    width: 160,
    height: 160,
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
    lineHeight: 54, // Added to give more vertical space
    paddingVertical: 4, // Added padding to prevent cutoff
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
    fontFamily: 'Poppins-SemiBold',  // Add font for consistency
  },
  
  subTagline: {
    fontSize: 16,
    color: TEXT_MID,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',  // Add font for consistency
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
    color: PRIMARY_PURPLE,  // Changed from TEXT_DARK to purple
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Quicksand',  // Match the brand font
  },
  
  slide2Subtitle: {
    fontSize: 16,
    color: TEXT_MID,
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Poppins-Medium',  // Readable body font
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
    color: PRIMARY_PURPLE,  // Changed to purple
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',  // Consistent font
  },
  
  stepDesc: { 
    fontSize: 14, 
    color: TEXT_MID,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  // Readable body font
  },

  card: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  
  cardTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: TEXT_DARK, 
    marginBottom: 6, 
    textAlign: 'center' 
  },
  
  cardDesc: { 
    fontSize: 15, 
    color: TEXT_MID, 
    textAlign: 'center',
    lineHeight: 21,
  },

  ctaButton: {
    backgroundColor: PRIMARY_PURPLE,
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 999,
    alignSelf: 'center',
    shadowColor: PRIMARY_PURPLE,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    borderColor: 'rgba(135, 160, 142, 0.3)',  // Sage green border
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
    color: PRIMARY_PURPLE,  // Changed to purple
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Quicksand',  // Match brand font
  },

  authSubtitle: { 
    fontSize: 16, 
    color: TEXT_MID,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',  // Readable body font
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
    borderColor: 'rgba(107, 91, 149, 0.2)',  // Purple tinted border
    marginBottom: 14,
    fontFamily: 'Poppins-Medium',  // Better readability
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: TEXT_DARK,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 14,
  },

  authForm: { 
    width: '100%',
  },

  termsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    marginBottom: 20,
  },
  
  checkbox: {
    width: 22, 
    height: 22, 
    borderRadius: 6,
    borderWidth: 2, 
    borderColor: TEXT_DARK, 
    marginRight: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  
  checkboxChecked: { 
    backgroundColor: PRIMARY_PURPLE, 
    borderColor: PRIMARY_PURPLE,
  },
  
  checkmark: { 
    color: '#FFFFFF', 
    fontWeight: '800',
    fontSize: 14,
  },
  
  termsText: { 
    color: TEXT_MID, 
    fontSize: 14, 
    flex: 1,
    lineHeight: 20,
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
    borderColor: 'rgba(107, 91, 149, 0.4)', 
    marginRight: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  checkboxChecked: { 
    backgroundColor: PRIMARY_PURPLE, 
    borderColor: PRIMARY_PURPLE,
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

  switchAuthText: { 
    color: TEXT_MID, 
    fontSize: 15,
    textAlign: 'center',
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
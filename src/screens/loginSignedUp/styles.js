import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  keyboardView: { 
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
  },
  // Efeito de fundo
  blurBackground: {
    position: 'absolute',
    left: 198,
    top: -64,
    opacity: 0.10,
    zIndex: 0,
  },
  blurCircle: {
    width: 256,
    height: 256,
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 100, height: 100 },
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 100,
  },
  // Header
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    paddingBottom: 16,
  },
  iconWrapper: {
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 28.52,
    height: 30,
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
  },
  titleContainer: {
    marginBottom: 0,
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitleContainer: {
    paddingTop: 4,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  // Form Container
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
    zIndex: 1,
  },
  // Login Header
  loginHeader: {
    paddingBottom: 32,
  },
  loginTitleContainer: {
    marginBottom: 4,
  },
  loginTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 25,
  },
  loginDescriptionContainer: {
    marginTop: 0,
  },
  loginDescription: {
    color: '#64748B',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 24,
  },
  // Inputs Section
  inputsSection: {
    paddingBottom: 16,
    gap: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabelContainer: {
    paddingLeft: 4,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 14,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 20,
  },
  inputFieldContainer: {
    position: 'relative',
  },
  inputField: {
    height: 56,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  inputFieldPassword: {
    height: 56,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 48,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#0F172A',
    padding: 0,
  },
  inputIconEmail: {
    position: 'absolute',
    left: 18,
    top: 20,
    width: 20,
    height: 16,
    backgroundColor: '#94A3B8',
  },
  inputIconLock: {
    position: 'absolute',
    left: 20,
    top: 17,
    width: 16,
    height: 21,
    backgroundColor: '#94A3B8',
  },
  inputIconEye: {
    position: 'absolute',
    right: 20,
    top: 22,
    width: 22,
    height: 15,
    backgroundColor: '#94A3B8',
  },
  // Forgot Password
  forgotPasswordWrapper: {
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    color: 'rgba(179, 103, 212, 0.84)',
    fontSize: 14,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 20,
  },
  // Login Button
  loginButtonWrapper: {
    paddingTop: 8,
  },
  loginButton: {
    height: 56,
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
  },
  loginButtonShadow: {
    position: 'absolute',
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 12,
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  loginButtonArrow: {
    width: 13.5,
    height: 13.5,
    backgroundColor: 'white',
  },
  // Footer Section
  footerSection: {
    paddingTop: 3,
    paddingBottom: 48,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 40,
    paddingBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    textTransform: 'uppercase',
    lineHeight: 16,
    letterSpacing: 1.2,
  },
  signUpButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(179, 103, 212, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpText: {
    color: 'rgba(179, 103, 212, 0.84)',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  securityIcon: {
    width: 9.33,
    height: 11.67,
    backgroundColor: '#10B981',
  },
  securityText: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '500',
    textTransform: 'uppercase',
    lineHeight: 16.5,
  },
});
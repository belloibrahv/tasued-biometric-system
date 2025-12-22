// Professional Design System - Google Material Design Inspired
// Consistent colors, spacing, and components across all dashboards

export const colors = {
  // Primary - Blue
  primary: {
    50: 'bg-blue-50',
    100: 'bg-blue-100',
    500: 'bg-blue-500',
    600: 'bg-blue-600',
    700: 'bg-blue-700',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-700',
  },
  // Success - Green
  success: {
    50: 'bg-green-50',
    100: 'bg-green-100',
    600: 'bg-green-600',
    700: 'bg-green-700',
    text: 'text-green-600',
    textDark: 'text-green-700',
    border: 'border-green-200',
  },
  // Error - Red
  error: {
    50: 'bg-red-50',
    100: 'bg-red-100',
    600: 'bg-red-600',
    700: 'bg-red-700',
    text: 'text-red-600',
    textDark: 'text-red-700',
    border: 'border-red-200',
  },
  // Warning - Orange
  warning: {
    50: 'bg-orange-50',
    100: 'bg-orange-100',
    600: 'bg-orange-600',
    text: 'text-orange-600',
    textDark: 'text-orange-700',
  },
  // Info - Purple
  info: {
    50: 'bg-purple-50',
    100: 'bg-purple-100',
    600: 'bg-purple-600',
    text: 'text-purple-600',
    textDark: 'text-purple-700',
  },
  // Neutral
  neutral: {
    50: 'bg-gray-50',
    100: 'bg-gray-100',
    200: 'bg-gray-200',
    white: 'bg-white',
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      tertiary: 'text-gray-500',
      disabled: 'text-gray-400',
    },
    border: 'border-gray-200',
    borderLight: 'border-gray-100',
  },
};

export const spacing = {
  page: 'p-6 lg:p-8',
  section: 'space-y-6',
  card: 'p-6',
  cardCompact: 'p-4',
  gap: {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  },
};

export const typography = {
  h1: 'text-2xl lg:text-3xl font-semibold text-gray-900',
  h2: 'text-xl lg:text-2xl font-semibold text-gray-900',
  h3: 'text-lg font-semibold text-gray-900',
  subtitle: 'text-gray-500 mt-1',
  body: 'text-sm text-gray-600',
  bodyMedium: 'text-sm font-medium text-gray-900',
  caption: 'text-xs text-gray-500',
  label: 'text-sm font-medium text-gray-700',
};

export const components = {
  card: {
    base: 'bg-white rounded-xl border border-gray-200',
    hover: 'hover:border-blue-300 hover:shadow-sm transition-all',
    interactive: 'cursor-pointer',
  },
  button: {
    primary: 'bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50',
    ghost: 'text-gray-600 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors',
    icon: 'p-2 rounded-lg hover:bg-gray-100 transition-colors',
  },
  input: {
    base: 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    search: 'pl-10',
  },
  badge: {
    success: 'inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium',
    error: 'inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full font-medium',
    warning: 'inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-medium',
    info: 'inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium',
    neutral: 'inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium',
  },
  avatar: {
    base: 'rounded-full flex items-center justify-center font-medium',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg',
  },
  iconContainer: {
    base: 'rounded-xl flex items-center justify-center',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  },
  table: {
    header: 'bg-gray-50 border-b border-gray-200',
    headerCell: 'text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
    row: 'hover:bg-gray-50 transition-colors',
    cell: 'px-6 py-4 text-sm text-gray-900',
  },
  emptyState: {
    container: 'p-12 text-center',
    icon: 'w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4',
    title: 'font-medium text-gray-900 mb-1',
    description: 'text-sm text-gray-500',
  },
};

export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  spin: 'animate-spin',
};

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  card: 'shadow-sm hover:shadow-md transition-shadow',
};

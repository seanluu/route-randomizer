// Common styles
export const commonShadow = {
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
} as const;

export const lightShadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
} as const;

// Card patterns
export const commonCard = {
  margin: 20,
  borderRadius: 16,
  overflow: 'hidden' as const,
  ...commonShadow,
};

export const lightCard = {
  margin: 20,
  padding: 20,
  backgroundColor: '#fff',
  borderRadius: 16,
  ...lightShadow,
};

export const compactCard = {
  margin: 20,
  borderRadius: 12,
  overflow: 'hidden' as const,
  ...commonShadow,
};

// Button patterns
export const commonButton = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
};

// Use inside LinearGradient wrappers to ensure consistent padding/alignment
export const gradientButton = {
  ...commonButton,
};

export const iconButton = {
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: 'transparent',
};

// Text patterns
export const commonText = {
  fontSize: 14,
  fontWeight: '600' as const,
  color: '#333',
};

export const titleText = {
  fontSize: 18,
  fontWeight: 'bold' as const,
  color: '#333',
};

export const largeTitleText = {
  fontSize: 28,
  fontWeight: 'bold' as const,
  color: '#333',
};

export const subtitleText = {
  fontSize: 16,
  color: '#666',
};

export const whiteText = {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold' as const,
};

export const primaryText = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#4A90E2',
};

// Border patterns
export const commonBorder = {
  borderTopWidth: 1,
  borderTopColor: '#e9ecef',
};

export const whiteBorder = {
  borderTopWidth: 1,
  borderTopColor: 'rgba(255, 255, 255, 0.2)',
};

// Layout patterns
export const flexRow = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

export const flexRowSpaceBetween = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
};

export const flexRowSpaceAround = {
  flexDirection: 'row' as const,
  justifyContent: 'space-around' as const,
};

export const flexColumn = {
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
};

// Spacing patterns
export const standardPadding = {
  padding: 20,
};

export const compactPadding = {
  padding: 15,
};

export const standardMargin = {
  margin: 20,
};

export const compactMargin = {
  margin: 15,
};

import './Button.css';

const VARIANT_CLASS = {
  primary: 'qz-btn--primary',
  secondary: 'qz-btn--secondary',
  ghost: 'qz-btn--ghost',
  danger: 'qz-btn--danger',
  glass: 'qz-btn--glass',
};

export default function Button({
  children, variant = 'primary', size = 'md', icon: Icon,
  iconPosition = 'left', full = false, active = false,
  as: Comp = 'button', className = '', ...props
}) {
  const classes = [
    'qz-btn', VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    `qz-btn--${size}`, full ? 'qz-btn--full' : '', active ? 'qz-btn--active' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Comp className={classes} {...props}>
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 16 : 18} strokeWidth={2.25} />}
      {children && <span>{children}</span>}
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 16 : 18} strokeWidth={2.25} />}
    </Comp>
  );
}

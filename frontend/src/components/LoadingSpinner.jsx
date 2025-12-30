const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: { width: '20px', height: '20px', border: '2px' },
    md: { width: '40px', height: '40px', border: '3px' },
    lg: { width: '60px', height: '60px', border: '4px' },
  };

  const style = {
    width: sizes[size].width,
    height: sizes[size].height,
    borderWidth: sizes[size].border,
  };

  return (
    <div className="spinner-container">
      <div className="spinner" style={style}></div>
    </div>
  );
};

export default LoadingSpinner;

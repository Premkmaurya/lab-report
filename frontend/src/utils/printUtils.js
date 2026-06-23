export const handlePrint = (onBeforePrint, onAfterPrint) => {
  if (onBeforePrint) {
    onBeforePrint();
  }
  
  // A slight delay ensures React state updates (like showing the print container) are fully flushed to the DOM
  setTimeout(() => {
    // Focus the window to guarantee the print dialog captures the correct document context
    window.focus();
    window.print();
    
    if (onAfterPrint) {
      onAfterPrint();
    }
  }, 150);
};

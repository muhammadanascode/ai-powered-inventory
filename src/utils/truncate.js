// Helper function to truncate long text for better display in UI
 const truncate = (text,length) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
};

export default truncate;
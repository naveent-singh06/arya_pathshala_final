const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
  return (
    <section>
        <h3 style={{
        marginTop: "30px", 
        width: "40%",
        marginBottom: "50px", 
        marginLeft: "400px",
        marginRight: "-20px"
      }}>
        Made with Passion ✊ by <span style={{color: "rgb(15, 69, 155)"}}>Team Digi Dynamos</span></h3>
        <button
        onClick={scrollToTop}
        style={{
          display: "block",
          margin: "20px auto",
          marginTop: "20px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor:"rgb(82, 147, 253)",
          color: "black",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          transition: "background-color 0.3s, transform 0.3s",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "rgb(7, 79, 196)";
          e.target.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "rgb(82, 147, 253)";
          e.target.style.transform = "scale(1)";
        }}
      >
        Return to Top
      </button>
    </section>
    
  );
};

export default Footer;

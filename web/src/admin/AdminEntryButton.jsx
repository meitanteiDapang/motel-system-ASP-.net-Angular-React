import { useNavigate } from "react-router-dom";

const AdminEntryButton = () => {
  const navigate = useNavigate();

  return (
    <button
      className="admin-link"
      type="button"
      onClick={() => {
        navigate("/adminlogin");
      }}
    >
      Admin entry
    </button>
  );
};

export default AdminEntryButton;

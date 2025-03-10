// pages/index.js

import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingItem, setEditingItem] = useState(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");



  const [authError, setAuthError] = useState(""); 

  useEffect(() => {
    // Check if the user is logged in by checking for a valid token
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchItems(); 
    }
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get("http://52.9.202.95:4000/items", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setItems(response.data.items);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const addItem = async () => {
    try {
      const response = await axios.post(
        "http://52.9.202.95:4000/items",
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setItems([...items, response.data.item]);
      setName("");
      setDescription("");
      setAuthError(""); 
    } catch (error) {
      if (error.response && error.response.status === 429) {
        toast("Too many requests! Please try again later.");
      } else {
        console.error("Error adding item:", error);
      }
    }
  };

  const updateItem = async () => {
    try {
      const response = await axios.put(
        `http://52.9.202.95:4000/items/${editingItem._id}`,
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const updatedItems = items.map((item) =>
        item._id === editingItem._id ? response.data.item : item
      );
      setItems(updatedItems);
      setName("");
      setDescription("");
      setEditingItem(null);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        toast("Too many requests! Please try again later.");
      } else {
        console.error("Error updating item:", error);
      }
    }
  };

  const deleteItem = async (id) => {
    try {
      await axios.delete(`http://52.9.202.95:4000/items/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const filteredItems = items.filter((item) => item._id !== id);
      setItems(filteredItems);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        toast("Too many requests! Please try again later.");
      } else {
        console.error("Error deleting item:", error);
      }
    }
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log(email,password)
      const response = await axios.post("http://52.9.202.95:4000/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      setIsLoggedIn(true);
      setAuthError(""); 
      fetchItems();
    } catch (error) {
      setAuthError(error.response.data.error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://52.9.202.95:4000/register", { email, password });
      setAuthError(""); 
      toast("Registration successful! Please log in.");
    } catch (error) {
      setAuthError(error.response.data.error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  return (
    <div className="container">
      <h1>MERN CRUD App</h1>

      {/* Login/Signup Form */}
      {!isLoggedIn ? (
        <div className="auth-form">
          <h2>{authError ? <span style={{color: 'red'}}>{authError}</span> : 'Login or Signup'}</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
          </form>

          <p>Or</p>

          <form onSubmit={handleRegister}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Sign Up</button>
          </form>
        </div>
      ) : (
        <div>
          <div>
            <input
              type="text"
              placeholder="Item Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button onClick={editingItem ? updateItem : addItem}>
              {editingItem ? "Update Item" : "Add Item"}
            </button>
          </div>
          <ul>
            {items.map((item) => (
              <li key={item._id}>
                <div className="listing">{item.name} - {item.description}</div>
                <button onClick={() => startEditing(item)}>Edit</button>
                <button onClick={() => deleteItem(item._id)}>Delete</button>
              </li>
            ))}
          </ul>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

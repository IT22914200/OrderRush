import { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/assets";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    orderId: "",
    review: "",
    rate: "",
    userId: localStorage.getItem("uid"),
  });

  const fetchOrders = async () => {
    const response = await axios.post(
      url + "/api/order/userorders",
      {},
      { headers: { token } }
    );
    setData(response.data.data);
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const openReviewModal = (orderId) => {
    setReviewData((prevState) => ({ ...prevState, orderId }));
    setIsModalOpen(true);
  };

  const handleReviewChange = (e) => {
    setReviewData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(url + "/api/review/create", reviewData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsModalOpen(false);
      alert("Review submitted successfully!");
      // Optionally, refresh orders to show updated status
      fetchOrders();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order, index) => (
          <div key={index} className="my-orders-order">
            <img src={assets.parcel_icon} alt="" />
            <p>
              {order.items.map((item, index) =>
                index === order.items.length - 1
                  ? `${item.name} X ${item.quantity}`
                  : `${item.name} X ${item.quantity}, `
              )}
            </p>
            <p>${order.amount}.00</p>
            <p>Items: {order.items.length}</p>
            <p>
              <span>&#x25cf;</span>
              <b>{order.status}</b>
            </p>
            {order.status === "Delivered" && (
              <button onClick={() => openReviewModal(order._id)}>Review</button>
            )}
          </div>
          
        ))}
      </div>

      {isModalOpen && (
        <div className="review-modal">
          <div className="modal-content">
            <h3>Submit Review</h3>
            <form onSubmit={submitReview}>
              <textarea
                name="review"
                value={reviewData.review}
                onChange={handleReviewChange}
                placeholder="Write your review here..."
                required
              />
              <select
                name="rate"
                value={reviewData.rate}
                onChange={handleReviewChange}
                required
              >
                <option value="">Select rating</option>
                <option value="😞">😞</option>
                <option value="😐">😐</option>
                <option value="🙂">🙂</option>
                <option value="😊">😊</option>
                <option value="😄">😄</option>
              </select>
              <button type="submit">Submit Review</button>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      <h2 style={{ color: 'white' }}>My Orders</h2>
      <h2 style={{ color: 'white' }}>My Orders</h2>
      <h2 style={{ color: 'white' }}>My Orders</h2>
      <h2 style={{ color: 'white' }}>My Orders</h2>
      <h2 style={{ color: 'white' }}>My Orders</h2>
      <h2 style={{ color: 'white' }}>My Orders</h2>
      <h2 style={{ color: 'white' }}>My Orders</h2>

    </div>
  );
};

export default MyOrders;

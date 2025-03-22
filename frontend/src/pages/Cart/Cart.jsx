import React, { useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, url } =
    useContext(StoreContext);

  const navigate = useNavigate();

  return (
    <div className="cart">
      <div className="cart-item">
        <div className="cart-item-title">
          <p>Image</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item, index) => {
          if (cartItems) {
            if (cartItems[item._id] > 0) {
              return (
                <div
                  className="cart-items-title cart-items-item"
                  key={item?._id}
                >
                  <img src={url + "/images/" + item?.image} alt={item?.name} />
                  <p>{item?.name}</p>
                  <p>${item?.price}</p>
                  <p>{cartItems[item?._id]}</p>
                  <p>${item?.price * cartItems[item?._id]}</p>
                  <p
                    onClick={() => removeFromCart(item?._id)}
                    className="cross"
                  >
                    X
                  </p>
                </div>
              );
            }
          }
          return <></>;
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Total</h2>
          <hr />
          <div className="cart-total-detail">
            <p>Subtotal</p>
            <p style={{color: 'black'}}>${getTotalCartAmount()}</p>
          </div>
          <div className="cart-total-detail">
            <p>Delivery Fee</p>
            <p style={{color: 'black'}}>${getTotalCartAmount() === 0 ? 0 : 2}</p>
          </div>
          <div className="cart-total-detail">
            <b>Total</b>
            <b>${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>
          </div>
          <hr />
        </div>
        <button onClick={() => navigate("/order")} className="checkout">
          PROCEED TO CHECKOUT
        </button>
      </div>
      <div>
        <p className="procode"style={{color: 'black'}}>If you have a promo code,Enter it here</p>
        <div className="cart-promocode-input">
          <input type="text" placeholder="promo code" />
          <button onClick={() => navigate("/order")}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

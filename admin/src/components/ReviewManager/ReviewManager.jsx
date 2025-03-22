import { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { baseUrl } from "../../constants";
import SentimentAnalysis from "./SentimentAnalysis";

const { Option } = Select;

const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingReview, setEditingReview] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    fetchReviews();
    fetchUsers();
  }, []);

  useEffect(() => {
    handleSearch(searchText);
  }, [reviews, searchText]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/review/list`);
      console.log("Fetched reviews:", response.data); // For debugging
      setReviews(response.data);
      setFilteredReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      message.error("Failed to fetch reviews");
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/user/list`);
      setUsers(response.data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to fetch users");
    }
    setLoading(false);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = reviews.filter((review) =>
      Object.values(review).some((val) =>
        val?.toString().toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredReviews(filtered);
  };

  const handleEdit = (record) => {
    setEditingReview(record);
    form.setFieldsValue({
      ...record,
      reviewedBy: record.reviewedBy?._id,
      orderId: record.orderId?._id,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/review/${id}`);
      await fetchReviews();
      message.success("Review deleted successfully");
    } catch (error) {
      console.error("Error deleting review:", error);
      message.error("Failed to delete review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);

      if (editingReview) {
        await axios.put(`${baseUrl}/api/review/${editingReview._id}`, values);
        message.success("Review updated successfully");
      } else {
        await axios.post(`${baseUrl}/api/review/create`, values);
        message.success("Review created successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchReviews();
    } catch (error) {
      console.error("Error saving review:", error);
      message.error("Failed to save review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingReview(null);
    setOrderItems([]);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Reviews Report", 14, 15);

    const tableColumn = [
      "ID",
      "Reviewed By",
      "Review",
      "Rate",
      "Order ID",
      "Date",
    ];
    const tableRows = filteredReviews.map((review) => [
      review.rid,
      review.reviewedBy?.name,
      review.review,
      review.rate,
      review.orderId?._id,
      new Date(review.createdAt).toLocaleDateString(),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("reviews_report.pdf");
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "rid",
      key: "rid",
    },
    {
      title: "Reviewed By",
      dataIndex: ["reviewedBy", "name"],
      key: "reviewedBy",
    },
    {
      title: "Review",
      dataIndex: "review",
      key: "review",
      sorter: (a, b) => a.review.localeCompare(b.review),
    },
    {
      title: "Sentiment Analysis",
      dataIndex: "review",
      key: "sentiment",
      render: (review) => <SentimentAnalysis review={review} />,
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      filters: [
        { text: "😞", value: "😞" },
        { text: "😐", value: "😐" },
        { text: "🙂", value: "🙂" },
        { text: "😊", value: "😊" },
        { text: "😄", value: "😄" },
      ],
      onFilter: (value, record) => record.rate === value,
    },
    // {
    //   title: "Order ID",
    //   dataIndex: ["orderId", "_id"],
    //   key: "orderId._id",
    //   render: (orderId) => orderId || "N/A",
    // },

    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (orderId) => orderId?.oid || orderId || "N/A",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {/* <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} /> */}
          <Popconfirm
            title="Are you sure you want to delete this review?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>Review Management</h1>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search reviews"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 200 }}
        />
        <Button type="primary" icon={<FilePdfOutlined />} onClick={generatePDF}>
          Generate PDF Report
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={filteredReviews}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title={editingReview ? "Edit Review" : "Add New Review"}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={actionLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="reviewedBy"
            label="Reviewed By"
            rules={[{ required: true, message: "Please select a user" }]}
          >
            <Select placeholder="Select User">
              {users.map((user) => (
                <Option key={user._id} value={user._id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="review"
            label="Review"
            rules={[{ required: true, message: "Please enter a review" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="rate"
            label="Rate"
            rules={[{ required: true, message: "Please select a rating" }]}
          >
            <Select placeholder="Select Rating">
              <Option value="😞">😞</Option>
              <Option value="😐">😐</Option>
              <Option value="🙂">🙂</Option>
              <Option value="😊">😊</Option>
              <Option value="😄">😄</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="orderId"
            label="Order ID"
            rules={[{ required: true, message: "Please select an order" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              onChange={async (value) => {
                try {
                  const response = await axios.get(
                    `${baseUrl}/api/order/${value}`
                  );
                  setOrderItems(response.data.items);
                } catch (error) {
                  console.error("Error fetching order items:", error);
                  message.error("Failed to fetch order items");
                }
              }}
            >
              {reviews.map((review) => (
                <Option key={review.orderId?._id} value={review.orderId?._id}>
                  {review.orderId?._id}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="itemId"
            label="Item ID"
            rules={[{ required: true, message: "Please select an item" }]}
          >
            <Select placeholder="Select Item">
              {orderItems.map((item) => (
                <Option key={item.oid} value={item.oid}>
                  {item.name} (ID: {item.oid})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewManager;
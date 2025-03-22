import { useState, useEffect } from "react";
import { Table, Input, Space, message, Button, Popconfirm, Select } from "antd";
import axios from "axios";
import { baseUrl } from "../../constants";
import UserDetailsBox from "../../components/Common/UserDetailsBox";
import { DeleteOutlined } from "@ant-design/icons";

const CustomerMessages = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    handleSearch(searchText);
  }, [messages, searchText]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/customer-message/list`);
      setMessages(response.data.data);
      setFilteredMessages(response.data.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      message.error("Failed to fetch messages");
    }
    setLoading(false);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = messages.filter((message) =>
      Object.values(message).some((val) =>
        val.toString().toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredMessages(filtered);
  };

  const columns = [
    {
      title: "Message ID",
      dataIndex: "_id",
      key: "_id",
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      render: (userId) => <UserDetailsBox id={userId} />,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          onChange={(val) => {
            handleEdit(record._id, { status: val });
          }}
          defaultValue={record.status}
        >
          <Select.Option value="pending">Pending</Select.Option>
          <Select.Option value="resolved">Resolved</Select.Option>
        </Select>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this order?"
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

  const handleEdit = async (id, data) => {
    setLoading(true);
    try {
      await axios.put(`${baseUrl}/api/customer-message/${id}`, data);
      message.success("Message updated successfully");
      fetchMessages();
    } catch (error) {
      console.error("Error updating message:", error);
      message.error("Failed to update message");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/customer-message/${id}`);
      message.success("Message deleted successfully");
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      message.error("Failed to delete message");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Customer Messages</h1>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search messages"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 200 }}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={filteredMessages}
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
};

export default CustomerMessages;

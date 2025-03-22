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
import UserDetailsBox from "../Common/UserDetailsBox";

const { Option } = Select;

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchUsers();
  }, []);

  useEffect(() => {
    handleSearch(searchText);
  }, [orders, searchText]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/order/list`);
      setOrders(response.data.data);
      setFilteredOrders(response.data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error("Failed to fetch orders");
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
    const filtered = orders.filter((order) =>
      Object.values(order).some((val) =>
        val.toString().toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredOrders(filtered);
  };

  const handleEdit = (record) => {
    setEditingOrder({
      ...record,
      address: !record.address.firstName
        ? record.address
        : `${record.address.firstName},${record.address.lastName},${record.address.street},${record.address.city},${record.address.state}`,
    });
    form.setFieldsValue({
      ...record,
      address: !record.address.firstName
        ? record?.address
        : `${record.address.firstName},${record.address.lastName},${record.address.street},${record.address.city},${record.address.state}`,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/order/${id}`);
      message.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      message.error("Failed to delete order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      setActionLoading(true);
      try {
        if (editingOrder) {
          await axios.put(`${baseUrl}/api/order/${editingOrder._id}`, values);
          message.success("Order updated successfully");
        } else {
          await axios.post(`${baseUrl}/api/order`, values);
          message.success("Order created successfully");
        }
        setIsModalVisible(false);
        setEditingOrder(null);
        form.resetFields();
        fetchOrders();
      } catch (error) {
        console.error("Error saving order:", error);
        message.error("Failed to save order");
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingOrder(null);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Orders Report", 14, 15);

    const tableColumn = [
      "ID",
      "User ID",
      "Amount",
      "Status",
      "Payment",
      "Date",
    ];
    const tableRows = filteredOrders.map((order) => [
      order._id,
      order.userId,
      order.amount,
      order.status,
      order.payment ? "Paid" : "Unpaid",
      new Date(order.date).toLocaleDateString(),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("orders_report.pdf");
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "oid",
      key: "oid",
    },
    {
      title: "User",
      dataIndex: "userId",
      render: (userId) => <UserDetailsBox id={userId} />,
      key: "userId",
      sorter: (a, b) => a.userId.localeCompare(b.userId),
    },
    {
      title: "Quantity",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (_, record) => {
        if (record.address.firstName) {
          return `${record.address.street},${record.address.city},${record.address.state},${record.address.zipcode},${record.address.country}`;
        }
        return record.address;
      },
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Food Processing", value: "Food Processing" },
        { text: "Out for Delivery", value: "Out for Delivery" },
        { text: "Delivered", value: "Delivered" },
      ],
      onFilter: (value, record) => record.status.indexOf(value) === 0,
    },
    {
      title: "Payment",
      dataIndex: "payment",
      key: "payment",
      render: (payment) => (payment ? "Paid" : "Unpaid"),
      filters: [
        { text: "Paid", value: true },
        { text: "Unpaid", value: false },
      ],
      onFilter: (value, record) => record.payment === value,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
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

  return (
    <div>
      <h1>Order Management</h1>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search orders"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 200 }}
        />
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          Add New Order
        </Button>
        <Button type="primary" icon={<FilePdfOutlined />} onClick={generatePDF}>
          Generate PDF Report
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="_id"
        loading={loading}
      />
      <Modal
        title={editingOrder ? "Edit Order" : "Add New Order"}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={actionLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="userId" label="User ID" rules={[{ required: true }]}>
            <Select>
              {users.map((user) => (
                <Select.Option key={user._id} value={user._id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true }]}
          >
            <Input disabled={editingOrder} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="Food Processing">Food Processing</Option>
              <Option value="Out for Delivery">Out for Delivery</Option>
              <Option value="Delivered">Delivered</Option>
            </Select>
          </Form.Item>
          <Form.Item name="payment" label="Payment" valuePropName="checked">
            <Select>
              <Option value={true}>Paid</Option>
              <Option value={false}>Unpaid</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderManager;

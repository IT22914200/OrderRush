import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Space,
  message,
  Popconfirm,
} from "antd";
import { SearchOutlined, FilePdfOutlined } from "@ant-design/icons";
import axios from "axios";
import { baseUrl } from "../../constants";
import jsPDF from "jspdf";
import "jspdf-autotable";
import DeliveryPersonManager from "../DeliverPersonManager/DeliverPersonManager";

const { Option } = Select;

const DeliveryManager = () => {
  const [assignments, setAssignments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeliveryPersons, setShowDeliveryPersons] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchDeliveryPersons();
    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = assignments.filter(
      (assignment) =>
        assignment._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.orderId.oid.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAssignments(filtered);
  }, [searchTerm, assignments]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/delivery/assignments`);
      setAssignments(response.data.data);
      setFilteredAssignments(response.data.data);
    } catch (error) {
      message.error("Failed to fetch delivery assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/order/list`);
      setOrders(response.data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error("Failed to fetch orders");
    }
    setLoading(false);
  };

  const fetchDeliveryPersons = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/delivery-person`);
      setDeliveryPersons(response.data.data);
    } catch (error) {
      message.error("Failed to fetch delivery persons");
    }
  };

  const handleCreate = () => {
    setModalType("create");
    setSelectedAssignment(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (assignment) => {
    setModalType("edit");
    setSelectedAssignment(assignment);
    form.setFieldsValue({
      orderId: assignment.orderId.oid,
      deliveryPersonId: assignment.deliveryPersonId._id,
      status: assignment.status,
    });
    setModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        if (modalType === "create") {
          await axios.post(`${baseUrl}/api/delivery/assignments`, values);
          message.success("Delivery assignment created successfully");
        } else {
          await axios.put(
            `${baseUrl}/api/delivery/assignments/${selectedAssignment._id}`,
            values
          );
          message.success("Delivery assignment updated successfully");
        }
        setModalVisible(false);
        fetchAssignments();
      } catch (error) {
        message.error(`Failed to ${modalType} delivery assignment`);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/delivery/assignments/${id}`);
      message.success("Delivery assignment deleted successfully");
      fetchAssignments();
    } catch (error) {
      message.error("Failed to delete delivery assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Delivery Assignments", 14, 15);

    const tableColumn = [
      "Assignment ID",
      "Order ID",
      "Delivery Person",
      "Status",
      "Assigned At",
    ];
    const tableRows = filteredAssignments.map((assignment) => [
      assignment._id,
      assignment.orderId.oid,
      `${assignment.deliveryPersonId?.firstName} ${assignment.deliveryPersonId?.lastName}`,
      assignment.status,
      new Date(assignment.assignedAt).toLocaleDateString(),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("delivery_assignments.pdf");
  };

  const columns = [
    {
      title: "Assignment ID",
      dataIndex: "_id",
      key: "_id",
      sorter: (a, b) => a._id.localeCompare(b._id),
    },
    {
      title: "Order ID",
      dataIndex: ["orderId", "oid"],
      key: "orderId",
      sorter: (a, b) => a.orderId.oid.localeCompare(b.orderId.oid),
    },
    {
      title: "Delivery Person",
      dataIndex: "deliveryPersonId",
      key: "deliveryPersonId",
      render: (person) => `${person?.firstName} ${person?.lastName}`,
      sorter: (a, b) =>
        a.deliveryPersonId?.firstName.localeCompare(
          b.deliveryPersonId?.firstName
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status?.localeCompare(b.status),
    },
    {
      title: "Assigned At",
      dataIndex: "assignedAt",
      key: "assignedAt",
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure you want to delete this assignment?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>Delivery Management</h1>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search assignments"
          prefix={<SearchOutlined />}
          onChange={handleSearch}
        />
        <Button onClick={handleCreate} type="primary">
          Assign a driver
        </Button>
        <Button icon={<FilePdfOutlined />} onClick={generatePDF}>
          Generate PDF
        </Button>
        <Button 
          type="primary" 
          onClick={() => setShowDeliveryPersons(!showDeliveryPersons)}
        >
          Manage Delivery Persons
        </Button>
      </Space>
      <Table
        loading={loading}
        dataSource={filteredAssignments}
        columns={columns}
        rowKey="_id"
      />
      <Modal
        title={
          modalType === "create"
            ? "Create Delivery Assignment"
            : "Edit Delivery Assignment"
        }
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="orderId"
            label="Order ID"
            rules={[{ required: true, message: "Please enter the order ID!" }]}
          >
            {/* <Select>
              {orders.map((order) => (
                <Select.Option key={order.oid} value={order.id}>
                  {order.oid}
                </Select.Option>
              ))}
            </Select> */}

<Select>
  {orders.map((order) => (
    <Select.Option key={order._id} value={order._id}>
      {order.oid}
    </Select.Option>
  ))}
</Select>
          </Form.Item>
          <Form.Item
            name="deliveryPersonId"
            label="Delivery Person"
            rules={[
              { required: true, message: "Please select a delivery person!" },
            ]}
          >
            <Select>
              {deliveryPersons.map((person) => (
                <Option key={person._id} value={person._id}>
                  {`${person?.firstName} ${person?.lastName}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status!" }]}
          >
            <Select>
              <Option value="Assigned">Assigned</Option>
              <Option value="Completed">Completed</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      {showDeliveryPersons && <DeliveryPersonManager />}
    </div>
  );
};

export default DeliveryManager;
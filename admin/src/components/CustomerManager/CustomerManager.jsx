import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { baseUrl } from "../../constants";
import jsPDF from "jspdf";
import "jspdf-autotable";

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/user/list`);
      setCustomers(response.data.data);
      setFilteredCustomers(response.data.data);
    } catch (error) {
      message.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      address: customer.address,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/user/${id}`);
      message.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      message.error("Failed to delete customer");
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        const data = {
          name: values.name,
          email: values.email,
          phoneNumber: values.phoneNumber,
          address: values.address,
          password: editingCustomer ? undefined : "customer123", // Set default password only for new customers
        };

        if (editingCustomer) {
          await axios.put(`${baseUrl}/api/user/${editingCustomer._id}`, data);
          message.success("Customer updated successfully");
        } else {
          await axios.post(`${baseUrl}/api/user/register`, data);
          message.success("Customer added successfully");
        }
        setModalVisible(false);
        fetchCustomers();
      } catch (error) {
        message.error("Failed to save customer");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Customer List", 14, 15);

    const tableColumn = ["Name", "Email"];
    const tableRows = filteredCustomers.map((customer) => [
      customer.name,
      customer.email,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("customers.pdf");
  };

  const columns = [
    {
      title: "Customer Id",
      dataIndex: "uid",
      key: "uid",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      sorter: (a, b) => a.phoneNumber.localeCompare(b.phoneNumber),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this customer?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<PlusOutlined />} onClick={handleAdd}>
          Add Customer
        </Button>
        <Input
          placeholder="Search customers"
          prefix={<SearchOutlined />}
          onChange={handleSearch}
        />
        <Button icon={<FilePdfOutlined />} onClick={generatePDF}>
          Generate PDF
        </Button>
      </Space>
      <Table
        loading={loading}
        dataSource={filteredCustomers}
        columns={columns}
        rowKey="_id"
      />
      <Modal
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input the name!" }]}
          >
            <Input disabled={editingCustomer} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please input the email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[
              { required: true, message: "Please input the phone number!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: "Please input the address!" }]}
          >
            <Input.TextArea />
          </Form.Item>

          {!editingCustomer && (
            <Form.Item name="password" label="Password">
              <label style={{ marginBottom: 8 }}>
                {` Default password for the customer is "customer123"`}
              </label>
              <Input.Password disabled defaultValue="customer123" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManager;

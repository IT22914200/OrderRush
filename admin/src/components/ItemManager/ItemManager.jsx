import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Spin,
  Upload,
  Space,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SearchOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { baseUrl } from "../../constants";
import jsPDF from "jspdf";
import "jspdf-autotable";

const { Option } = Select;

const ItemManager = () => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingFood, setEditingFood] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFoods();
  }, []);

  useEffect(() => {
    const filtered = foods.filter(
      (food) =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFoods(filtered);
  }, [searchTerm, foods]);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/food/list`);
      setFoods(response.data.data);
      setFilteredFoods(response.data.data);
    } catch (error) {
      message.error("Failed to fetch food items");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFood(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    form.setFieldsValue({
      ...food,
      dietaryInfo: Object.keys(food.dietaryInfo).filter(
        (key) => food.dietaryInfo[key]
      ),
      isOnOffer: food.specialOffer.isOnOffer,
      offerDescription: food.specialOffer.offerDescription,
      discountPercentage: food.specialOffer.discountPercentage,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/food/remove/${id}`);
      message.success("Food item deleted successfully");
      fetchFoods();
    } catch (error) {
      message.error("Failed to delete food item");
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (key === "image" && values[key] && values[key][0]) {
            formData.append(key, values[key][0].originFileObj);
          } else if (key === "dietaryInfo") {
            formData.append(
              key,
              JSON.stringify({
                isVegetarian: values[key].includes("isVegetarian"),
                isGlutenFree: values[key].includes("isGlutenFree"),
                isVegan: values[key].includes("isVegan"),
              })
            );
          } else if (key === "ingredients") {
            formData.append(key, JSON.stringify(values[key]));
          } else if (
            key === "isOnOffer" ||
            key === "offerDescription" ||
            key === "discountPercentage"
          ) {
            // Handle special offer fields
            formData.append(`specialOffer[${key}]`, values[key]);
          } else {
            formData.append(key, values[key]);
          }
        });

        if (editingFood) {
          await axios.put(
            `${baseUrl}/api/food/update/${editingFood._id}`,
            formData
          );
          message.success("Food item updated successfully");
        } else {
          await axios.post(`${baseUrl}/api/food/add`, formData);
          message.success("Food item added successfully");
        }
        setModalVisible(false);
        fetchFoods();
      } catch (error) {
        message.error("Failed to save food item");
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
    doc.text("Food Items List", 14, 15);

    const tableColumn = [
      "Name",
      "Description",
      "Price",
      "Category",
      "Ingredients",
      "Dietary Info",
      "Special Offer",
    ];
    const tableRows = filteredFoods.map((food) => [
      food.name,
      food.description,
      food.price,
      food.category,
      food.ingredients.join(", "),
      Object.keys(food.dietaryInfo)
        .filter((key) => food.dietaryInfo[key])
        .join(", "),
      food.specialOffer.isOnOffer
        ? `${food.specialOffer.offerDescription} (${food.specialOffer.discountPercentage}% off)`
        : "No offer",
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("food_items.pdf");
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: "Ingredients",
      dataIndex: "ingredients",
      key: "ingredients",
      render: (ingredients) => ingredients.join(", "),
    },
    // {
    //   title: "Dietary Info",
    //   dataIndex: "dietaryInfo",
    //   key: "dietaryInfo",
    //   render: (dietaryInfo) =>
    //     Object.keys(dietaryInfo)
    //       .filter((key) => dietaryInfo[key])
    //       .join(", "),
    // },
    {
      title: "Special Offer",
      dataIndex: "specialOffer",
      key: "specialOffer",
      render: (specialOffer) =>
        specialOffer.isOnOffer
          ? `${specialOffer.offerDescription} (${specialOffer.discountPercentage}% off)`
          : "No offer",
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image) => (
        <img
          src={`${baseUrl}/images/${image}`}
          alt="Food"
          style={{ width: 50, height: 50 }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this item?"
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
          Add Food Item
        </Button>
        <Input
          placeholder="Search food items"
          prefix={<SearchOutlined />}
          onChange={handleSearch}
        />
        <Button icon={<FilePdfOutlined />} onClick={generatePDF}>
          Generate PDF
        </Button>
      </Space>
      <Spin spinning={loading}>
        <Table dataSource={filteredFoods} columns={columns} rowKey="_id" />
      </Spin>
      <Modal
        title={editingFood ? "Edit Food Item" : "Add Food Item"}
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
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: "Please input the price!" }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select the category!" }]}
          >
            <Select>
              {/* <Option value="appetizer">Appetizer</Option>
              <Option value="main">Main Course</Option>
              <Option value="dessert">Dessert</Option>
              <Option value="beverage">Beverage</Option> */}
               <option value="Salad">Salad</option>
              <option value="Rolls">Rolls</option>
              <option value="Deserts">Deserts</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Cake">Cake</option>
              <option value="Pure Veg">Pure Veg</option>
              <option value="Pasta">Pasta</option>
              <option value="Noodles">Noodles</option>
            </Select>
          </Form.Item>
          <Form.Item
            name="ingredients"
            label="Ingredients"
            rules={[
              { required: true, message: "Please input the ingredients!" },
            ]}
          >
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Enter ingredients"
            ></Select>
          </Form.Item>
          <Form.Item name="dietaryInfo" label="Dietary Information">
            <Checkbox.Group>
              <Checkbox value="isVegetarian">Vegetarian</Checkbox>
              <Checkbox value="isGlutenFree">Gluten-Free</Checkbox>
              <Checkbox value="isVegan">Vegan</Checkbox>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item name="isOnOffer" valuePropName="checked">
            <Checkbox>Special Offer</Checkbox>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.isOnOffer !== currentValues.isOnOffer
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("isOnOffer") ? (
                <>
                  <Form.Item
                    name="offerDescription"
                    label="Offer Description"
                    rules={[
                      {
                        required: true,
                        message: "Please input the offer description!",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="discountPercentage"
                    label="Discount Percentage"
                    rules={[
                      {
                        required: true,
                        message: "Please input the discount percentage!",
                      },
                    ]}
                  >
                    <InputNumber min={0} max={100} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="image"
            label="Image"
            valuePropName="image"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e && e.fileList;
            }}
            rules={[
              { required: !editingFood, message: "Please upload an image!" },
            ]}
          >
            <Upload beforeUpload={() => false} listType="picture">
              <Button icon={<UploadOutlined />}>Click to upload</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ItemManager;

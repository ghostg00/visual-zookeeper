import { Form, Input, Modal } from "antd";
import React from "react";
import { FormComponentProps } from "antd/es/form";
import { ModalProps } from "antd/es/modal";
import TextArea from "antd/lib/input/TextArea";

export interface CreateNodeFormProps extends FormComponentProps {
  visible: boolean;
  parentNode: string;
  onCancel: ModalProps["onCancel"];
  onCreate: ModalProps["onOk"];
}

class CreateNodeForm extends React.Component<CreateNodeFormProps> {
  render() {
    const { visible, parentNode, onCancel, onCreate, form } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Modal
        title={"添加节点"}
        visible={visible}
        onCancel={onCancel}
        onOk={onCreate}
      >
        <Form>
          <Form.Item label="父节点">{parentNode}</Form.Item>
          <Form.Item label="节点名">
            {getFieldDecorator("nodeName", {
              rules: [{ required: true, message: "请输入节点名称" }]
            })(<Input placeholder={"请输入节点名称"} />)}
          </Form.Item>
          <Form.Item label="节点值">
            {getFieldDecorator("nodeData")(
              <TextArea placeholder={"请输入节点值"} />
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default Form.create<CreateNodeFormProps>()(CreateNodeForm);

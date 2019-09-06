import React, { Component } from 'react';
import {
  Form, Input, Select, Modal, Spin, DatePicker, 
} from 'choerodon-ui';
import { FormattedMessage } from 'react-intl';
import { addFolder, checkCycleName } from '../../../../api/cycleApi';
import { getFoldersByVersion } from '../../../../api/IssueManageApi';

const { Option } = Select;
const FormItem = Form.Item;
const { Sidebar } = Modal;
const { RangePicker } = DatePicker;

class CreateStage extends Component {
  state = {
    folders: [],
    selectLoading: false,
    loading: false,
  }

  componentWillReceiveProps(nextProps) {
    const { resetFields } = this.props.form;
    if (this.props.visible === false && nextProps.visible === true) {
      resetFields();
    }
  }

  onOk = () => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {        
        const { range } = values;
        const [fromDate, toDate] = range || [null, null];
        const { CreateStageIn } = this.props;
        const { cycleId, versionId } = CreateStageIn;
        addFolder({
          ...values,          
          parentCycleId: cycleId,
          versionId,        
          type: 'folder',
          fromDate: fromDate ? fromDate.startOf('day').format('YYYY-MM-DD HH:mm:ss') : null,
          toDate: toDate ? toDate.endOf('day').format('YYYY-MM-DD HH:mm:ss') : null,         
        }).then((res) => {
          if (res.failed) {
            Choerodon.prompt('同名循环已存在');
          } else {
            this.props.onOk();
          }
          this.setState({ loading: false });
        }).catch(() => {
          Choerodon.prompt('网络异常');
          this.setState({ loading: false });
        });
      }
    });
  }

  validateName = async (rule, name, callback) => {
    const { CreateStageIn } = this.props;
    const { cycleId, versionId } = CreateStageIn;
    const hasSame = await checkCycleName({
      type: 'folder',
      cycleName: name,
      versionId,
      parentCycleId: cycleId,
    });
    if (hasSame) {
      callback('含有同名阶段');
    } else {
      callback();
    }
  }

  loadFolders = (value) => {
    if (value !== '') {
      return;
    }
    this.setState({
      selectLoading: true,
    });
    const { CreateStageIn } = this.props;
    const { versionId } = CreateStageIn;
    getFoldersByVersion(versionId).then((folders) => {
      this.setState({
        folders,
        selectLoading: false,
      });
    });
  }


  render() {
    const {
      visible, onOk, onCancel, CreateStageIn, 
    } = this.props;
    const {
      title, versionId, fromDate, toDate, 
    } = CreateStageIn;
    const { getFieldDecorator } = this.props.form;
    const { folders, loading, selectLoading } = this.state;
    const options = folders.map(folder => (
      <Option value={folder.folderId} key={folder.folderId}>
        {folder.name}
      </Option>
    ));
    return (
      <div>        
        <Sidebar
          title={<FormattedMessage id="testPlan_createStage" />}
          visible={visible}
          onOk={this.onOk}
          onCancel={onCancel}
          width={380}
        >         
          <Spin spinning={loading}>
            <Form>                
              <FormItem>
                {getFieldDecorator('cycleName', {
                  rules: [{
                    required: true, message: '请输入名称!',
                  }, {
                    validator: this.validateName,
                  }],
                })(
                  <Input maxLength={30} label={<FormattedMessage id="name" />} />,                    
                )}
              </FormItem>
              <FormItem>
                
                {getFieldDecorator('description', {
                  
                })(
                  <Input maxLength={30} label={<FormattedMessage id="comment" />} />,
                )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('folderId', {
                  rules: [{
                    required: true, message: '请选择文件夹!',
                  }],
                })(
                  <Select
                    loading={selectLoading}
                    onFilterChange={this.loadFolders}                      
                    label={<FormattedMessage id="testPlan_linkFolder" />}
                    optionFilterProp="children"
                    filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                    filter
                  >
                    {options}
                  </Select>,                    
                )}
              </FormItem>
              <FormItem>
                <span className="c7n-input-wrapper c7n-input-has-value c7n-input-has-label">
                  <div className="c7n-input-label" style={{ transform: 'none' }}><span>持续时间</span></div>
                  {getFieldDecorator('range', {
                    rules: [{
                      required: true, message: '请选择日期!',
                    }],
                  })(
                    <RangePicker                                   
                      format="YYYY-MM-DD"
                      style={{ width: '100%' }}
                    />,
                  )}
                </span>
              </FormItem>
            </Form>
          </Spin>          
        </Sidebar>
      </div>
    );
  }
}

CreateStage.propTypes = {

};

export default Form.create()(CreateStage);

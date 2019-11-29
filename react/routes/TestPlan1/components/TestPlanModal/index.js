import React, {
  useEffect, useMemo, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Form, TextField, DataSet, TextArea, DateTimePicker, Select, Radio,
} from 'choerodon-ui/pro';
import { observer } from 'mobx-react-lite';
import UserHead from '@/components/UserHead';
import Tip from '@/components/Tip';
import DataSetFactory from './dataSet';
import SelectIssue from './SelectIssue';
import SelectIssueStore from './SelectIssueStore';
import Context from './context';

const key = Modal.key();

const propTypes = {
  initValue: PropTypes.shape({}).isRequired,
  onSubmit: PropTypes.func.isRequired,
};
function TestPlanModal({
  modal, initValue, onSubmit, mode = 'create',
}) {
  const { caseSelected: initCaseSelected } = initValue || {};
  const selectIssueStore = useMemo(() => new SelectIssueStore(), []);
  const dataSet = useMemo(() => new DataSet(DataSetFactory({ initValue, mode, SelectIssueStore: selectIssueStore })), [initValue, mode, selectIssueStore]);
  useEffect(() => {
    selectIssueStore.loadIssueTree(initCaseSelected);
  }, [initCaseSelected, selectIssueStore]);
  const submit = useCallback(async () => {
    // console.log('click');
    try {
      // dataSet.validate();
      const result = await dataSet.submit();
      // if (result.success) {
      //   onSubmit(result.list[0]);
      //   modal.close();
      // }
      return false;
    } catch (error) {
      // console.log(error);
      return false;
    }
  }, [dataSet]);
  useEffect(() => {
    modal.handleOk(submit);
  }, [modal, submit]);

  return (
    <Context.Provider value={{ SelectIssueStore: selectIssueStore }}>
      <Form dataSet={dataSet} style={{ width: 512 }}>
        <TextField name="name" required maxLength={30} />
        <TextArea
          name="description"
        />
        <Select
          name="managerId"
          searchable
          searchMatcher="param"
          optionRenderer={({ record }) => <UserHead user={record.toData()} />}
          // renderer={({ record }) => <UserHead user={record.toData()} />}
        />
        <DateTimePicker range name="range" min={Date.now()} />
        <div>
          <div>
            <span>导入用例方式</span>
            <Tip title="导入用例方式" />
          </div>
          <Radio name="custom" value={false} defaultChecked>全部用例</Radio>
          <Radio name="custom" value>自选用例</Radio>
        </div>
      </Form>
      <div style={{ display: dataSet.current && dataSet.current.get('custom') ? 'block' : 'none' }}>
        <SelectIssue />
      </div>
      <Form dataSet={dataSet} style={{ width: 512 }}>
        <div>
          <div>
            <span>是否自动同步</span>
            <Tip title="即用例库的用例更新之后是否同步更新计划中的用例" />
          </div>
          <Radio name="autoSync" value defaultChecked>是</Radio>
          <Radio name="autoSync" value={false}>否</Radio>
        </div>
      </Form>
    </Context.Provider>
  );
}
TestPlanModal.propTypes = propTypes;
const ObserverTestPlanModal = observer(TestPlanModal);
export function openCreatePlan() {
  Modal.open({
    title: '创建计划',
    key,
    drawer: true,
    style: {
      width: 1090,
    },
    children: <ObserverTestPlanModal mode="create" />,
  });
}
export function openEditPlan() {
  Modal.open({
    title: '编辑计划',
    key,
    drawer: true,
    style: {
      width: 1090,
    },
    children: <ObserverTestPlanModal mode="edit" />,
  });
}
export function openClonePlan() {
  Modal.open({
    title: '克隆计划',
    key,
    drawer: true,
    style: {
      width: 1090,
    },
    children: <ObserverTestPlanModal mode="clone" />,
  });
}

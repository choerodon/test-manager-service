/* eslint-disable react/jsx-no-bind */
import React, { useContext, useCallback, useEffect } from 'react';
import {
  Choerodon, axios, stores,
} from '@choerodon/boot';
import { observer } from 'mobx-react-lite';
import { FormattedMessage } from 'react-intl';
import { Button, Modal } from 'choerodon-ui/pro';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { updatePlanStatus } from '@/api/TestPlanApi';
import { openEditPlan } from '../TestPlanModal';
import ConfirmCompleteModalChildren from './components/ConfirmCompleteModalChildren';
import Store from '../../stores';
import './TestPlanHeader.less';

const { AppState } = stores;
const confirmCompletePlanModalKey = Modal.key();

function TestPlanHeader() {
  const { testPlanStore, createAutoTestStore } = useContext(Store);
  const history = useHistory();
  const { testPlanStatus, getCurrentPlanId, getCurrentCycle } = testPlanStore;
  const {
    id, name, category, organizationId,
  } = AppState.currentMenuType;
  const queryStr = queryString.stringify({
    id,
    name,
    category,
    planName: getCurrentCycle && getCurrentCycle.data ? getCurrentCycle.data.name : '',
    type: 'project',
    organizationId,
  });
  const onUpdatePlanStatus = async (planItem, newStatus) => {
    updatePlanStatus({
      planId: planItem.item.id,
      objectVersionNumber: planItem.item.data.objectVersionNumber,
      statusCode: newStatus,
    }).then(() => {
      if (newStatus === 'doing') {
        Choerodon.prompt('开始测试成功');
        testPlanStore.setTestPlanStatus('doing');
        testPlanStore.loadAllData();
      } else {
        Choerodon.prompt('完成测试成功');
        testPlanStore.setTestPlanStatus('done');
        testPlanStore.loadAllData();
      }
    }).catch(() => {
      if (newStatus === 'doing') {
        Choerodon.prompt('开始测试失败');
      } else {
        Choerodon.prompt('完成测试失败');
      }
    });
  };

  const confirmCompletePlan = (planItem, newStatus) => {
    Modal.open({
      key: confirmCompletePlanModalKey,
      title: '完成计划确认',
      children: (
        <ConfirmCompleteModalChildren planName={planItem.item.data.name} testPlanStore={testPlanStore} />
      ),
      okText: '确定',
      onOk: async () => {
        await onUpdatePlanStatus(planItem, newStatus);
        Modal.open({
          title: '跳转到计划报告',
          onOk: () => {
            history.push(`/testManager/TestPlan/report/${getCurrentPlanId}?${queryStr}`);
          },
        });
      },
      cancelText: '取消',
      style: { width: '5.6rem' },
      className: 'c7ntest-testPlan-completePlan-confirm-modal',
    });
  };

  const handleUpdatePlanStatus = (newStatus) => {
    const { getItem } = testPlanStore.treeRef.current || {};
    const planItem = getItem(testPlanStore.getCurrentPlanId) || {};
    if (planItem.item && planItem.item.id) {
      if (newStatus === 'doing') {
        onUpdatePlanStatus(planItem, newStatus);
      } else {
        confirmCompletePlan(planItem, newStatus);
      }
    }
  };

  const handleCreateAutoTest = () => {
    createAutoTestStore.setVisible(true);
  };
  const handlePlanEdit = useCallback((newPlan) => {
    testPlanStore.setCalendarLoading(true);
    testPlanStore.loadIssueTree().then(() => {
      testPlanStore.setCalendarLoading(false);
    }).catch(() => {
      Choerodon.prompt('更新计划日历失败');
      testPlanStore.setCalendarLoading(false);
    });
    // 更新右侧数据
    if (testPlanStore.getCurrentPlanId === newPlan.planId) {
      testPlanStore.loadPlanDetail();
    }
  }, [testPlanStore]);
  const handleOpenEditPlan = useCallback(async () => {
    openEditPlan({
      planId: getCurrentPlanId,
      onEdit: handlePlanEdit,
    });
  }, [getCurrentPlanId, handlePlanEdit]);
  const handleReportClick = useCallback(() => {
    history.push(`/testManager/TestPlan/report/${getCurrentPlanId}?${queryStr}`);
  }, [getCurrentPlanId, history]);
  return (
    <>
      {
        testPlanStatus !== 'done' && (
          <>
            {getCurrentPlanId && (
              <Button icon="mode_edit" onClick={handleOpenEditPlan}>
                <FormattedMessage id="testPlan_editPlan" />
              </Button>
            )}
            {
              getCurrentPlanId && testPlanStatus === 'todo' ? (
                <Button icon="play_circle_filled" onClick={handleUpdatePlanStatus.bind(this, 'doing')}>
                  <FormattedMessage id="testPlan_manualTest" />
                </Button>
              ) : (
                getCurrentPlanId && (
                <Button icon="check_circle" disabled={testPlanStatus !== 'doing'} onClick={handleUpdatePlanStatus.bind(this, 'done')}>
                  <FormattedMessage id="testPlan_completePlan" />
                </Button>
                )
              )
            }
            {/* <Button icon="auto_test">
              <FormattedMessage id="testPlan_autoTest" />
            </Button> */}
          </>
        )
      }
      {(getCurrentPlanId && (testPlanStatus === 'done' || testPlanStatus === 'doing')) && (
        <Button
          icon="find_in_page"
          onClick={handleReportClick}
        >
          计划报告
        </Button>
      )}
    </>
  );
}
export default observer(TestPlanHeader);

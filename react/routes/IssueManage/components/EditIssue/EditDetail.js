/* eslint-disable */
import React, { Component, Fragment, useState } from 'react';
import { Choerodon } from '@choerodon/boot';
import { withRouter } from 'react-router-dom';
import { stores, Permission } from '@choerodon/boot';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import { throttle } from 'lodash';
import {
  Select, Input, Button, Modal, Tooltip, Dropdown, Menu, Spin, Icon, Tabs,
} from 'choerodon-ui';

import { UploadButtonNow } from '../CommonComponent';
import { IssueDescription } from '../CommonComponent';
import { TextEditToggle, User, ResizeAble } from '../../../../components';
import {
  delta2Html, handleFileUpload, text2Delta,
} from '../../../../common/utils';
import Timeago from '../../../../components/DateTimeAgo/DateTimeAgo';
import { getLabels, getPrioritys, getModules } from '../../../../api/agileApi';
import { getUsers, getUpdateProjectInfoPermission } from '../../../../api/IamApi';
import { FullEditor, WYSIWYGEditor } from '../../../../components';
import CreateLinkTask from '../CreateLinkTask';
import UserHead from '../UserHead';
import Divider from './Component/Divider';
import EditDetailWrap from './Component/EditDetailWrap';
import './EditDetail.less';
import LinkIssues from './link-issues'; // 问题链接

const { Text, Edit } = TextEditToggle;

const { AppState, HeaderStore } = stores;
const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;
const { TitleWrap, ContentWrap, PropertyWrap } = EditDetailWrap;
/**
 * 问题详情
 * folderName
 * @param {*} linkIssues
 * @param {*} reloadIssue  重载问题  
 */
function EditDetail(props) {
  const {
    issueInfo, linkIssues, reloadIssue, folderName, editIssue, setFileList, fileList, 
  } = props;
  // 编辑全屏
  const [FullEditorShow, setFullEditorShow] = useState(false);
  const [editDescriptionShow, setEditDescriptionShow] = useState(false);
  const [createLinkTaskShow, setCreateLinkTaskShow] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [userList, setUserList] = useState([]);
  const [labelList, setLabelList] = useState([]);
  const [selectLoading, setSelectLoading] = useState(true);
  const [disable, setDisabled] = useState(true);
  /**
     *报告人更改
     *
     * @memberof EditIssueNarrow
     */
  const renderSelectPerson = (type) => {
    const { checkDisabledModifyOrDelete } = props;
    const {
      reporterId, reporterName, reporterRealName, reporterLoginName, reporterImageUrl, 
    } = issueInfo;

    const userOptions = userList.map(user => (
      <Option key={user.id} value={user.id}>
        <User user={user} />
      </Option>
    ));
    const targetUser = _.find(userList, { id: reporterId });
    let showUser = reporterId || '无';
    // 当存在用户且列表没找到
    if (reporterId && !targetUser) {
      showUser = (
        <UserHead
          user={{
            id: reporterId,
            name: reporterName,
            loginName: reporterLoginName,
            realName: reporterRealName,
            avatar: reporterImageUrl,
          }}
        />
      );
    }
    return (
      <TextEditToggle
        style={{ flex: 1 }}
        disabled={checkDisabledModifyOrDelete()}
        formKey="reporterId"
        onSubmit={(id, done) => { editIssue({ reporterId: id || 0 }, done); }}
        originData={showUser}
      >
        <Text>
          {(data) => {
            if (data) {
              const tempShowUser = _.find(userList, { id: data });
              return tempShowUser ? (
                <User user={tempShowUser} />
              ) : data;
            } else {
              return '无';
            }
          }}
        </Text>
        <Edit>
          <Select
            filter
            allowClear
            autoFocus
            filterOption={false}
            onFilterChange={(value) => {
              setSelectLoading(true);
              getUsers(value).then((res) => {
                setUserList(res.list);
                setSelectLoading(false);
              });
            }}
            loading={selectLoading}
            style={{ width: 170 }}
          >
            {userOptions}
          </Select>
        </Edit>
      </TextEditToggle>
    );
  };

  function transToArr(arr, pro, type = 'string') {
    if (typeof arr !== 'object') {
      return '';
    }
    if (!arr.length) {
      return type === 'string' ? '无' : [];
    } else if (typeof arr[0] === 'object') {
      return type === 'string' ? _.map(arr, pro).join() : _.map(arr, pro);
    } else {
      return type === 'string' ? arr.join() : arr;
    }
  }

  /**
     *标签更改
     *
     * @memberof EditIssueNarrow
     */
  const renderSelectLabel = () => {
    const { labelIssueRelVOList } = issueInfo;
    return (
      <TextEditToggle
                // disabled={disabled}
        style={{ width: '100%' }}
        formKey="labelIssueRelVOList"
        onSubmit={(value, done) => { editIssue({ labelIssueRelVOList: value }, done); }}
        originData={transToArr(labelIssueRelVOList, 'labelName', 'array')}
      >
        <Text>
          {data => (
            data.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {
                                    transToArr(data, 'labelName', 'array').map(label => (
                                      <div
                                        key={label}
                                        className="c7ntest-text-dot"
                                        style={{
                                          color: '#000',
                                          borderRadius: '100px',
                                          fontSize: '13px',
                                          lineHeight: '24px',
                                          padding: '2px 12px',
                                          maxWidth: 100,
                                          background: 'rgba(0, 0, 0, 0.08)',
                                          marginRight: '8px',
                                          marginBottom: 3,
                                        }}
                                      >
                                        {label}
                                      </div>
                                    ))
                                }
              </div>
            ) : '无'
          )}
        </Text>
        <Edit>
          <Select
            loading={selectLoading}
            mode="tags"
            autoFocus
            getPopupContainer={triggerNode => triggerNode.parentNode}
            tokenSeparators={[',']}
            style={{ width: '200px', marginTop: 0, paddingTop: 0 }}
            onFocus={() => {
              selectLoading(true);
              getLabels().then((res) => {
                setLabelList(res);
                setSelectLoading(false);
              });
            }}
          >
            {labelList.map(label => (
              <Option
                key={label.labelName}
                value={label.labelName}
              >
                {label.labelName}
              </Option>
            ))}
          </Select>
        </Edit>
      </TextEditToggle>
    );
  };

  /**
     *指派人更改
     
     * @memberof EditIssueNarrow
     */
  const renderSelectAssign = () => {
    const {
      assigneeId, assigneeName, assigneeRealName, assigneeLoginName, assigneeImageUrl, 
    } = issueInfo;
    const userOptions = userList.map(user => (
      <Option key={user.id} value={user.id}>
        <User user={user} />
      </Option>
    ));
    const targetUser = _.find(userList, { id: assigneeId });
    let showUser = assigneeId || '无';
    // 当存在用户且列表没找到
    if (assigneeId && !targetUser) {
      showUser = (
        <UserHead
          user={{
            id: assigneeId,
            name: assigneeName,
            loginName: assigneeLoginName,
            realName: assigneeRealName,
            avatar: assigneeImageUrl,
          }}
        />
      );
    }
    return (
      <TextEditToggle
        style={{ flex: 1 }}
                // disabled={disabled}
        formKey="assigneeId"
        onSubmit={(id, done) => { editIssue({ assigneeId: id || 0 }, done); }}
        originData={showUser}
      >
        <Text>
          {(data) => {
            if (data) {
              const tempShowUser = _.find(userList, { id: data });
              return tempShowUser ? (
                <User user={tempShowUser} />
              ) : data;
            } else {
              return '无';
            }
          }}
        </Text>
        <Edit>
          <Select
            filter
            allowClear
            autoFocus
            filterOption={false}
            onFilterChange={(value) => {
              selectLoading(true);
              getUsers(value).then((res) => {
                setUserList(res.list);
                setSelectLoading(false);
              });
            }}
            loading={selectLoading}
            style={{ width: 170 }}
          >
            {userOptions}
          </Select>
        </Edit>
      </TextEditToggle>
    );
  };


  /**
     * Attachment
     */
  const addFileToFileList = (data) => {
    reloadIssue();
  };
  /**
 * Attachment
 */
  const onChangeFileList = (arr) => {
    const { issueId } = issueInfo;
    if (arr.length > 0 && arr.some(one => !one.url)) {
      const config = {
        // issueType: this.state.typeCode,
        issueId,
        fileName: arr[0].name || 'AG_ATTACHMENT',
        projectId: AppState.currentMenuType.id,
      };
      handleFileUpload(arr, addFileToFileList, config);
    }
  };

  /**
 * 用例描述
 *
 * @returns
 * @memberof EditIssueNarrow
 */
  function renderDescription() {
    const { description } = issueInfo;
    let delta;
    if (editDescriptionShow === undefined) {
      return null;
    }
    if (!description || editDescriptionShow) {
      delta = text2Delta(description);
      return (
        editDescriptionShow && (
        <div className="line-start mt-10">
          <WYSIWYGEditor
            autoFocus
            bottomBar
            defaultValue={delta}
            style={{ height: 200, width: '100%' }}
            handleDelete={() => {
              setEditDescriptionShow(false);
            }}

            handleSave={(value) => {
              editIssue({ description: value });

              setEditDescriptionShow(false);
            }}
          />
        </div>
        )
      );
    } else {
      delta = delta2Html(description);
      return (
        <ContentWrap>
          <IssueDescription data={delta} />
        </ContentWrap>
      );
    }
  }
  const handleCreateLinkIssue = () => {
    const { createLinkIssue } = props;
    if (createLinkIssue) {
      createLinkIssue();
      setCreateLinkTaskShow(false);
    } else {
      setCreateLinkTaskShow(false);
    }
  };
  function render() {
    const {
      creationDate, lastUpdateDate, description, issueId, 
    } = issueInfo;
    return (
      <React.Fragment>
        <div id="detail">
          <TitleWrap style={{ marginTop: 0 }} title={<FormattedMessage id="detail" />} />
          <ContentWrap style={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* 文件夹名称 */}
            <PropertyWrap label={<FormattedMessage id="issue_create_content_folder" />}>
              <div style={{ marginLeft: 6 }}>
                {folderName || '无'}
              </div>
            </PropertyWrap>
            {/* 报告人 */}
            <PropertyWrap
              className="assignee"
              label={<FormattedMessage id="issue_edit_reporter" />}
              valueStyle={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
            >
              {renderSelectPerson()}
            </PropertyWrap>
            {/* 创建时间 */}
            <PropertyWrap valueStyle={{ marginLeft: 6 }} label={<FormattedMessage id="issue_edit_createDate" />}>
              <Timeago date={creationDate} />
            </PropertyWrap>
            {showMore ? (
              <Fragment>
                {/* 标签 */}
                <PropertyWrap label={<FormattedMessage id="summary_label" />}>
                  {renderSelectLabel()}
                </PropertyWrap>
                {/** 经办人 */}
                <PropertyWrap label={<FormattedMessage id="issue_edit_manager" />} valueStyle={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {renderSelectAssign()}
                  <span
                    role="none"
                    className="primary"
                    style={{
                      cursor: 'pointer',
                      marginLeft: 5,
                      display: 'inline-block',
                    }}
                    onClick={() => {
                      editIssue({ assigneeId: AppState.userInfo.id });
                    }}
                  >
                    <FormattedMessage id="issue_edit_assignToMe" />
                  </span>
                </PropertyWrap>
                <PropertyWrap valueStyle={{ marginLeft: 6 }} label={<FormattedMessage id="issue_edit_updateDate" />}>
                  <Timeago date={lastUpdateDate} />
                </PropertyWrap>
              </Fragment>
            ) : null}
          </ContentWrap>
          <Button className="leftBtn" funcType="flat" onClick={() => setShowMore(!showMore)}>
            <span>{showMore ? '收起' : '展开'}</span>
            <Icon type={showMore ? 'baseline-arrow_drop_up' : 'baseline-arrow_right'} style={{ marginRight: 2 }} />
          </Button>
        </div>
        <Divider />
        {/** 描述 */}
        <div id="des">
          <TitleWrap title={<FormattedMessage id="execute_description" />}>
            <div style={{ marginLeft: '14px', display: 'flex' }}>
              <Tooltip title="全屏编辑" getPopupContainer={triggerNode => triggerNode.parentNode}>
                <Button icon="zoom_out_map" onClick={() => setFullEditorShow(true)} />
              </Tooltip>
              <Tooltip title="编辑" getPopupContainer={triggerNode => triggerNode.parentNode.parentNode}>
                <Button
                  icon="mode_edit mlr-3"
                  onClick={() => {
                    setEditDescriptionShow(true);
                  }}
                />
              </Tooltip>
            </div>
          </TitleWrap>
          {renderDescription()}
        </div>
        <Divider />
        {/** 附件 */}
        <div id="attachment">
          <TitleWrap title={<FormattedMessage id="attachment" />}>
            <div style={{ marginLeft: '14px', display: 'flex' }}>
              <Tooltip title="全屏编辑" getPopupContainer={triggerNode => triggerNode.parentNode}>
                <Button icon="zoom_out_map" onClick={() => setFullEditorShow(true)} />
              </Tooltip>
              <Tooltip title="编辑" getPopupContainer={triggerNode => triggerNode.parentNode.parentNode}>
                <Button
                  icon="mode_edit mlr-3"
                  onClick={() => {
                    setEditDescriptionShow(true);
                  }}
                />
              </Tooltip>
            </div>
          </TitleWrap>
          <ContentWrap style={{ marginTop: '-47px' }}>
            <UploadButtonNow
              onRemove={setFileList}
              onBeforeUpload={setFileList}
              updateNow={onChangeFileList}
              fileList={fileList}
            />
          </ContentWrap>
        </div>
        <Divider />
        {/** 问题链接 */}
        <div id="link_task">
          <TitleWrap title="问题链接">
            <div style={{ marginLeft: '14px' }}>
              <Tooltip title="问题链接" getPopupContainer={triggerNode => triggerNode.parentNode}>
                <Button icon="playlist_add" onClick={() => setCreateLinkTaskShow(true)} />
              </Tooltip>
            </div>
          </TitleWrap>
          <div className="c7ntest-tasks">
            <LinkIssues
              issueId={issueId}
              linkIssues={linkIssues}
              reloadIssue={reloadIssue}
            />
          </div>
        </div>
        {
                    FullEditorShow && (
                    <FullEditor
                      initValue={description}
                      visible={FullEditorShow}
                      onCancel={() => setFullEditorShow(false)}
                      onOk={(value) => {
                        setFullEditorShow(false);
                        editIssue({ description: value });
                      }}
                    />
                    )
                }
        {
                    createLinkTaskShow ? (
                      <CreateLinkTask
                        issueId={issueId}
                        visible={createLinkTaskShow}
                        onCancel={() => setCreateLinkTaskShow(false)}
                        onOk={handleCreateLinkIssue}
                      />
                    ) : null
                }
      </React.Fragment>
    );
  }
  return render();
}
export default EditDetail;

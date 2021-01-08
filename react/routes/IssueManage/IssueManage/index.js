import React, { useState } from 'react';
import { Tabs } from 'choerodon-ui';
import { stores } from '@choerodon/boot';
import { find } from 'lodash';
import IssueManage from './IssueManage';

const { AppState } = stores;
let tabs = [{
  name: '功能测试',
  key: 'functional',
  component: IssueManage,
}];

export function inject({ tabs: otherTab }) {
  console.log(otherTab)
  tabs = [...tabs, ...otherTab];
}

const { TabPane } = Tabs;
const Test = (props) => {
  let filteredTabs = tabs;
  // const isNormalProject = AppState.currentMenuType?.category === 'AGILE';
  // if (isNormalProject) {
  //   filteredTabs = isNormalProject ? tabs.filter(tab => tab.key !== 'api') : tabs;
  // }
  const [activeKey, setActiveKey] = useState(filteredTabs[0].key);
  const Component = find(filteredTabs, { key: activeKey }).component;

  const tabComponent = (
    <Tabs activeKey={activeKey} onChange={setActiveKey} className="c7ntest-IssueTree-tab">
      {filteredTabs.map(tab => <TabPane key={tab.key} tab={tab.name} />)}
    </Tabs>
  );
  return (
    <>
      {Component && <Component {...props} tab={tabComponent} tabs={filteredTabs} />}
    </>
  );
};

export default Test;

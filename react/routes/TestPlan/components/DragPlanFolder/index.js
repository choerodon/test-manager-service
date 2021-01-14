import React, {
  useCallback, useMemo, useRef, useState,
} from 'react';
import {
  Modal,
} from 'choerodon-ui/pro';
import { findIndex } from 'lodash';
import { observer } from 'mobx-react-lite';
import { handleRequestFailed } from '@/common/utils';
import { getPlanTreeById, moveFolder } from '@/api/TestPlanApi';
import Tree from '@/components/Tree';
import './index.less';
import { moveItemOnTree } from '@atlaskit/tree';
import { getTreePosition } from '@atlaskit/tree/dist/cjs/utils/tree';
import TreePlanNode from './TreePlanNode';
import useMultiSelect from './useMultiSelect';

const key = Modal.key();

const propTypes = {

};

function DragPlanFolder({
  data: propsData, planId,
}) {
  const treeRef = useRef();
  const [data, setTreeData] = useState(propsData);
  const [{ selectedNodeMaps, lastSelectNode }, { select }] = useMultiSelect({
    onLoadNode: (searchId) => {
      if (!treeRef.current || !treeRef.current.getItem) {
        return undefined;
      }
      const { item, path } = treeRef.current.getItem(searchId);
      return { ...item, path };
    },
  });
  /**   父节点检查 */
  function handleSelectNode(value, trigger = 'click') {
    console.log('treeRef.current', value, treeRef.current);
    if (trigger === 'ctrl') {
      select(value);
      return;
    }
    if (trigger === 'shift') { /** 1.  选第一个节点到 第三个  检查父节点是否是选中状态 是的话， 单选去除，多选  */
      if (lastSelectNode) {
        const { index: lastSelectNodeIndex } = getTreePosition(treeRef.current.flattenedTree, lastSelectNode.path);
        const { index: valueIndex } = getTreePosition(treeRef.current.flattenedTree, value.path);
        // const difference = lastSelectNodeIndex - valueIndex;

        const originNodes = treeRef.current.flattenedTree.slice(Math.min(lastSelectNodeIndex, valueIndex), Math.max(lastSelectNodeIndex, valueIndex));
        originNodes.length > 0 && select(originNodes.map(({ item, path }) => ({ ...item, path })));
      } else {
        select(value);
      }
    }
    // select(value);
  }
  const renderTreeNode = (treeNode, { item }) => {
    const { id } = item;
    return (
      <TreePlanNode data={item} onSelect={handleSelectNode} selected={selectedNodeMaps.has(id, item.path)}>
        {treeNode}
      </TreePlanNode>
    );
  };
  const handleDrag = useCallback(async (sourceItem, destination) => {
    const folderId = sourceItem.id;
    const { parentId } = destination;
    const { treeData } = treeRef.current;
    const parent = treeData.items[destination.parentId];
    const { index = parent.children.length } = destination;
    let lastId = parent.children[index - 1];
    let nextId = parent.children[index];
    // 解决树的拖拽排序 无法从上往下拖拽排序
    if (sourceItem.parentId === destination.parentId && sourceItem.index < index) {
      lastId = parent.children[index];
      nextId = parent.children.length !== index ? parent.children[index + 1] : null;
    }
    const lastRank = lastId ? treeData.items[lastId].data.rank : null;
    const nextRank = nextId ? treeData.items[nextId].data.rank : null;
    // const rank = '111';
    const folderIds = [];
    console.log('folderId..', folderId, selectedNodeMaps.list(), selectedNodeMaps.has(folderId));
    if (selectedNodeMaps.has(folderId)) {
      const folderList = selectedNodeMaps.list();
      // moveItemOnTree(treeRef.treeData);
      folderList.forEach((item) => {
        folderIds.push(item.id);
        const pos = getTreePosition(treeRef.current.treeData, item.path);
        const newTreeData = moveItemOnTree(treeRef.current.treeData, pos, destination);
        console.log('getTreePosition(treeRef.treeData, item.path)', item.path, pos, newTreeData);
      });
    } else {
      folderIds.push(folderId);
    }
    selectedNodeMaps.clear();

    const rank = await handleRequestFailed(moveFolder(folderIds, parentId, lastRank, nextRank));
    console.log('new Rank', rank, folderIds);
    const planTree = await getPlanTreeById(planId);
    const { rootIds, treeFolder } = planTree;
    const newData = {
      rootIds,
      treeFolder: treeFolder.map((folder) => {
        const {
          issueFolderVO, expanded, children, ...other
        } = folder;
        const result = {
          children: children || [],
          data: issueFolderVO,
          isExpanded: expanded,
          ...other,
        };
        return result;
      }),
    };
    setTreeData(newData);
    throw new Error('move position error');

    return {
      data: {
        ...sourceItem.data,
        // rank,
      },
    };
  }, [planId, selectedNodeMaps]);
  return (
    <Tree
      ref={treeRef}
      data={data}
      selected={{}}
      renderTreeNode={renderTreeNode}
      setSelected={() => { }}
      treeNodeProps={{
        enableAction: false,
      }}
      afterDrag={handleDrag}
    />
  );
}
DragPlanFolder.propTypes = propTypes;
const ObserverDragPlanFolder = observer(DragPlanFolder);
export default async function openDragPlanFolder({ planId, handleOk, beforeOpen }) {
  beforeOpen([planId]);
  const planTree = await getPlanTreeById(planId);
  const { rootIds, treeFolder } = planTree;
  const data = {
    rootIds,
    treeFolder: treeFolder.map((folder) => {
      const {
        issueFolderVO, expanded, children, ...other
      } = folder;
      const result = {
        children: children || [],
        data: issueFolderVO,
        isExpanded: expanded,
        ...other,
      };
      return result;
    }),
  };
  Modal.open({
    title: '调整计划结构',
    key,
    drawer: true,
    className: 'c7ntest-DragPlanFolder',
    style: {
      width: 340,
      padding: 0,
    },
    children: <ObserverDragPlanFolder data={data} planId={planId} />,
    okText: '关闭',
    footer: (okBtn) => okBtn,
    onOk: handleOk,
  });
}

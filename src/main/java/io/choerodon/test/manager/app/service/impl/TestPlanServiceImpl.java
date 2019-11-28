package io.choerodon.test.manager.app.service.impl;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import io.choerodon.asgard.saga.annotation.Saga;
import io.choerodon.asgard.saga.producer.StartSagaBuilder;
import io.choerodon.asgard.saga.producer.TransactionalProducer;
import io.choerodon.core.exception.CommonException;
import io.choerodon.core.iam.ResourceLevel;
import io.choerodon.test.manager.api.vo.*;
import io.choerodon.test.manager.app.service.*;
import io.choerodon.test.manager.infra.constant.SagaTopicCodeConstants;
import io.choerodon.test.manager.infra.dto.TestCycleDTO;
import io.choerodon.test.manager.infra.dto.TestPlanDTO;
import io.choerodon.test.manager.infra.enums.TestPlanStatus;
import io.choerodon.test.manager.infra.mapper.TestPlanMapper;
import io.choerodon.test.manager.infra.util.DBValidateUtil;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;

/**
 * @author: 25499
 * @date: 2019/11/26 14:17
 * @description:
 */
@Service
@Transactional(rollbackFor = Exception.class)
public class TestPlanServiceImpl implements TestPlanServcie {
    @Autowired
    private TestPlanMapper testPlanMapper;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private TestIssueFolderService testIssueFolderService;

    @Autowired
    private TestCaseService testCaseService;

    @Autowired
    private TestCycleService testCycleService;

    @Autowired
    private TestCycleCaseService testCycleCaseService;

    @Autowired
    private TransactionalProducer producer;

    @Override
    public TestPlanVO update(Long projectId, TestPlanVO testPlanVO) {
        TestPlanDTO testPlanDTO = modelMapper.map(testPlanVO, TestPlanDTO.class);
        if(testPlanMapper.updateByPrimaryKeySelective(testPlanDTO)!=1){
            throw new CommonException("error.update.plan");
        }
        return modelMapper.map(testPlanMapper.selectByPrimaryKey(testPlanDTO.getPlanId()), TestPlanVO.class);
    }

    @Override
    @Saga(code = SagaTopicCodeConstants.TEST_MANAGER_CREATE_PLAN,
            description = "test-manager创建测试计划", inputSchema = "{}")
    public TestPlanDTO create(Long projectId, TestPlanVO testPlanVO) {
        // 创建计划
        TestPlanDTO testPlan = modelMapper.map(testPlanVO, TestPlanDTO.class);
        testPlan.setProjectId(projectId);
        testPlan.setStatusCode(TestPlanStatus.TODO.getStatus());
        testPlan.setInitStatus("doing");
        TestPlanDTO testPlanDTO = baseCreate(testPlan);
        testPlanVO.setPlanId(testPlan.getPlanId());
        testPlanVO.setObjectVersionNumber(testPlan.getObjectVersionNumber());
        producer.apply(
                StartSagaBuilder
                        .newBuilder()
                        .withLevel(ResourceLevel.PROJECT)
                        .withRefType("")
                        .withSagaCode(SagaTopicCodeConstants.TEST_MANAGER_CREATE_PLAN)
                        .withPayloadAndSerialize(testPlanVO)
                        .withRefId("")
                        .withSourceId(projectId),
                builder -> {
                });

        return testPlanDTO;
    }

    @Override
    public void batchInsert(List<TestPlanDTO> testPlanDTOS) {

    }

    @Override
    public List<TestPlanTreeVO> ListPlanAndFolderTree(Long projectId, String statusCode) {
        TestPlanDTO testPlanDTO = new TestPlanDTO();
        testPlanDTO.setProjectId(projectId);
        testPlanDTO.setStatusCode(statusCode);
        List<TestPlanDTO> testPlanDTOS = testPlanMapper.select(testPlanDTO);
        if (CollectionUtils.isEmpty(testPlanDTOS)) {
            return new ArrayList<>();
        }
        List<TestPlanTreeVO> testPlanTreeVOS = new ArrayList<>();
        testPlanTreeVOS = modelMapper.map(testPlanDTOS, new TypeToken<List<TestPlanTreeVO>>() {
        }.getType());

        // 获取planIds,查询出所有底层文件夹Id
        List<Long> planIds = testPlanTreeVOS.stream().map(TestPlanTreeVO::getPlanId).collect(Collectors.toList());
        List<TestCycleDTO> testCycleDTOS = testCycleService.listByPlanIds(planIds);
        Map<Long, List<TestCycleDTO>> testCycleMap = testCycleDTOS.stream().collect(Collectors.groupingBy(TestCycleDTO::getPlanId));
        // 获取项目下所有的文件夹
        List<TestIssueFolderVO> testIssueFolderVOS = testIssueFolderService.queryListByProjectId(projectId);
        Map<Long, TestIssueFolderVO> allFolderMap = testIssueFolderVOS.stream().collect(Collectors.toMap(TestIssueFolderVO::getFolderId, Function.identity()));
        Map<Long, List<TestIssueFolderVO>> parentMap = testIssueFolderVOS.stream().collect(Collectors.groupingBy(TestIssueFolderVO::getParentId));
        testPlanTreeVOS.forEach(v -> {
            List<Long> root = new ArrayList<>();
            Map<Long, TestTreeFolderVO> map = new HashMap<>();
            List<TestCycleDTO> testCycles = testCycleMap.get(v.getPlanId());
            if (!CollectionUtils.isEmpty(testCycles)) {
                testCycles.forEach(testCycleDTO -> buildTree(root, testCycleDTO.getFolderId(), allFolderMap, map, parentMap));
                List<TestTreeFolderVO> testTreeFolderVOS = map.values().stream().collect(Collectors.toList());
                TestTreeIssueFolderVO testTreeIssueFolderVO = new TestTreeIssueFolderVO(root, testTreeFolderVOS);
                v.setTestTreeIssueFolderVO(testTreeIssueFolderVO);
            }
        });

        return testPlanTreeVOS;
    }

    @Override
    public void baseUpdate(TestPlanDTO testPlanDTO) {
        if (ObjectUtils.isEmpty(testPlanDTO)) {
            throw new CommonException("error.test.plan.is.null");
        }
        DBValidateUtil.executeAndvalidateUpdateNum(testPlanMapper::updateByPrimaryKeySelective, testPlanDTO, 1, "error.update.test.plan");
    }


    private TestPlanDTO baseCreate(TestPlanDTO testPlanDTO) {
        if (ObjectUtils.isEmpty(testPlanDTO)) {
            throw new CommonException("error.test.plan.is.not.null");
        }
        DBValidateUtil.executeAndvalidateUpdateNum(testPlanMapper::insertSelective, testPlanDTO, 1, "error.insert.test.plan");
        return testPlanDTO;
    }

    private void buildTree(List<Long> root, Long folderId, Map<Long, TestIssueFolderVO> allFolderMap, Map<Long, TestTreeFolderVO> map, Map<Long, List<TestIssueFolderVO>> parentMap) {
        TestIssueFolderVO testIssueFolderVO = allFolderMap.get(folderId);
        System.out.println(testIssueFolderVO.getFolderId());
        TestTreeFolderVO testTreeFolderVO = null;
        if (!ObjectUtils.isEmpty(map.get(folderId))) {
            testTreeFolderVO = map.get(folderId);
        }

        if (ObjectUtils.isEmpty(testTreeFolderVO)) {
            testTreeFolderVO = new TestTreeFolderVO();
            testTreeFolderVO.setId(testIssueFolderVO.getFolderId());
            if (CollectionUtils.isEmpty(parentMap.get(testIssueFolderVO.getFolderId()))) {
                testTreeFolderVO.setHasChildren(false);
            } else {
                testTreeFolderVO.setHasChildren(true);
            }
            testTreeFolderVO.setIssueFolderVO(testIssueFolderVO);
            testTreeFolderVO.setExpanded(false);
            testTreeFolderVO.setChildrenLoading(false);
            map.put(folderId, testTreeFolderVO);
        }

        if (testIssueFolderVO.getParentId() == 0) {
            if (!root.contains(testIssueFolderVO.getFolderId())) {
                root.add(testIssueFolderVO.getFolderId());
            }
            return;
        } else {
            TestTreeFolderVO parentTreeFolderVO = null;
            if (!ObjectUtils.isEmpty(map.get(testIssueFolderVO.getParentId()))) {
                parentTreeFolderVO = map.get(testIssueFolderVO.getParentId());
            }

            if (ObjectUtils.isEmpty(parentTreeFolderVO)) {
                parentTreeFolderVO = new TestTreeFolderVO();
                if (ObjectUtils.isEmpty(allFolderMap.get(testIssueFolderVO.getParentId()))) {
                    return;
                }
                TestIssueFolderVO parentFolderVO = allFolderMap.get(testIssueFolderVO.getParentId());
                if (CollectionUtils.isEmpty(parentMap.get(parentFolderVO.getFolderId()))) {
                    testTreeFolderVO.setHasChildren(false);
                } else {
                    testTreeFolderVO.setHasChildren(true);
                }
                parentTreeFolderVO.setId(parentFolderVO.getFolderId());
                parentTreeFolderVO.setIssueFolderVO(parentFolderVO);
                parentTreeFolderVO.setExpanded(false);
                parentTreeFolderVO.setChildrenLoading(false);
                parentTreeFolderVO.setChildren(Arrays.asList(testIssueFolderVO.getFolderId()));
                map.put(testIssueFolderVO.getParentId(), parentTreeFolderVO);
            } else {
                List<Long> children = new ArrayList<>();
                if (!ObjectUtils.isEmpty(parentTreeFolderVO.getChildren())) {
                    children.addAll(parentTreeFolderVO.getChildren());
                }
                if (!children.contains(testIssueFolderVO.getFolderId())) {
                    children.add(testIssueFolderVO.getFolderId());
                }
                parentTreeFolderVO.setChildren(children);
                map.put(testIssueFolderVO.getParentId(), parentTreeFolderVO);
            }
            buildTree(root, testIssueFolderVO.getParentId(), allFolderMap, map, parentMap);
        }
    }

}

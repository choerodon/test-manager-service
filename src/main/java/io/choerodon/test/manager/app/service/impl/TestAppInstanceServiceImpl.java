package io.choerodon.test.manager.app.service.impl;

import com.alibaba.fastjson.JSON;
import io.choerodon.asgard.api.dto.QuartzTask;
import io.choerodon.asgard.api.dto.ScheduleTaskDTO;
import io.choerodon.asgard.schedule.annotation.JobParam;
import io.choerodon.asgard.schedule.annotation.JobTask;
import io.choerodon.core.convertor.ConvertHelper;
import io.choerodon.core.iam.ResourceLevel;
import io.choerodon.core.oauth.DetailsHelper;
import io.choerodon.devops.api.dto.DevopsApplicationDeployDTO;
import io.choerodon.devops.api.dto.ErrorLineDTO;
import io.choerodon.devops.api.dto.ReplaceResult;
import io.choerodon.devops.infra.common.utils.TypeUtil;
import io.choerodon.mybatis.helper.AuditHelper;
import io.choerodon.test.manager.api.dto.ApplicationDeployDTO;
import io.choerodon.test.manager.api.dto.TestAppInstanceDTO;
import io.choerodon.test.manager.app.service.ScheduleService;
import io.choerodon.test.manager.app.service.TestAppInstanceService;
import io.choerodon.test.manager.app.service.TestCaseService;
import io.choerodon.test.manager.domain.service.*;
import io.choerodon.test.manager.domain.test.manager.entity.*;
import io.choerodon.test.manager.infra.common.utils.FileUtil;
import io.choerodon.test.manager.infra.common.utils.GenerateUUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.util.ObjectUtils;
import org.yaml.snakeyaml.Yaml;

import java.util.*;

/**
 * Created by zongw.lee@gmail.com on 22/11/2018
 */
@Component
public class TestAppInstanceServiceImpl implements TestAppInstanceService {

    @Autowired
    ITestAppInstanceService instanceService;

    @Autowired
    ITestAppInstanceLogService testAppInstanceLogService;

    @Autowired
    ITestEnvCommandService commandService;

    @Autowired
    ITestEnvCommandValueService commandValueService;

    @Autowired
    ScheduleService scheduleService;

    @Autowired
    TestCaseService testCaseService;

    @Autowired
    ITestAutomationHistoryService historyService;

    private static final String SCHEDULECODE = "test-deploy-instance";

    private static final String DEPLOYDTONAME = "deploy";

    private static Logger logger = LoggerFactory.getLogger(TestAppInstanceServiceImpl.class);

    @Override
    public ReplaceResult queryValues(Long projectId, Long appId, Long envId, Long appVersionId) {
        ReplaceResult replaceResult = new ReplaceResult();
        //从devops取得value
        String versionValue = testCaseService.getVersionValue(projectId, appVersionId);
        try {
            FileUtil.checkYamlFormat(versionValue);
        } catch (Exception e) {
            replaceResult.setYaml(versionValue);
            replaceResult.setErrorMsg(e.getMessage());
            replaceResult.setTotalLine(FileUtil.getFileTotalLine(replaceResult.getYaml()));
            replaceResult.setErrorLines(getErrorLine(e.getMessage()));
            return replaceResult;
        }
        String deployValue = FileUtil.checkValueFormat(instanceService.queryValueByEnvIdAndAppId(envId, appId));
        replaceResult.setYaml(versionValue);
        if (deployValue != null) {
            ReplaceResult sendResult = new ReplaceResult();
            sendResult.setYaml(deployValue);
            replaceResult = testCaseService.previewValues(projectId, sendResult, appVersionId);
        }
        return replaceResult;
    }

    @JobTask(code = SCHEDULECODE,
            level = ResourceLevel.PROJECT,
            description = "自动化测试任务-定时部署",
            maxRetryCount = 3, params = {
            @JobParam(name = DEPLOYDTONAME),
            @JobParam(name = "projectId", type = Long.class),
            @JobParam(name = "userId", type = Integer.class)
    })
    @Override
    public void createBySchedule(Map<String, Object> data) {
        logger.info("定时任务执行方法开始，时间{}", new Date());
        create(JSON.parseObject((String) data.get(DEPLOYDTONAME), ApplicationDeployDTO.class)
                , Long.valueOf((Integer) data.get("projectId")), Long.valueOf((Integer) data.get("userId")));
        logger.info("定时任务执行方法结束，时间{}", new Date());
    }

    @Override
    public QuartzTask createTimedTaskForDeploy(ScheduleTaskDTO taskDTO, Long projectId) {
        Assert.notNull(taskDTO.getParams().get(DEPLOYDTONAME), "error.deploy.param.deployDTO.not.be.null");
        String deployString = JSON.toJSONString(taskDTO.getParams().get(DEPLOYDTONAME));
        ApplicationDeployDTO deploy = JSON.parseObject(deployString, ApplicationDeployDTO.class);
        scheduleService.getMethodByService(projectId, "test-manager-service")
                .stream().filter(v -> v.getCode().equals(SCHEDULECODE))
                .findFirst()
                .ifPresent(v -> taskDTO.setMethodId(v.getId()));
        taskDTO.getParams().clear();
        taskDTO.getParams().put(DEPLOYDTONAME, deployString);
        taskDTO.getParams().put("projectId", projectId);
        taskDTO.getParams().put("userId", DetailsHelper.getUserDetails().getUserId());

        String appName = testCaseService.queryByAppId(projectId, deploy.getAppId()).getName();
        String appVersion = testCaseService.getAppversion(projectId, deploy.getAppVerisonId()).getVersion();
        taskDTO.setName("test-deploy-" + appName + "-" + appVersion + "-" + GenerateUUID.generateUUID());
        taskDTO.setDescription("测试应用：" + appName + "版本：" + appVersion + "定时部署");
        return scheduleService.create(projectId, taskDTO);
    }

    @Override
    public TestAppInstanceDTO create(ApplicationDeployDTO deployDTO, Long projectId, Long userId) {
        AuditHelper.audit().setUser(userId);
//        Optional.ofNullable(userId).ifPresent(v -> DetailsHelper.getUserDetails().setUserId(v));
        Yaml yaml = new Yaml();
        Assert.notNull(deployDTO.getValues(), "error.deployDTO.values.can.not.be.null");
        Map result = yaml.loadAs(deployDTO.getValues(), Map.class);
        Assert.notNull(result, "error.values.framework.can.not.be.null");
        TestEnvCommand envCommand;
        TestEnvCommandValue commandValue;
        ReplaceResult sendResult = new ReplaceResult();
        sendResult.setYaml(deployDTO.getValues());
        Assert.notNull(deployDTO.getValues(), "error.deployDTO.appVerisonId.can.not.be.null");
        ReplaceResult replaceResult = testCaseService.previewValues(projectId, sendResult, deployDTO.getAppVerisonId());
        if (ObjectUtils.isEmpty(deployDTO.getHistoryId())) {
            //校验values
            FileUtil.checkYamlFormat(deployDTO.getValues());
            Long commandValueId = null;
            if (!ObjectUtils.isEmpty(replaceResult.getDeltaYaml())) {
                commandValue = new TestEnvCommandValue();
                commandValue.setValue(replaceResult.getDeltaYaml());
                commandValueId = commandValueService.insert(commandValue).getId();
            }
            envCommand = new TestEnvCommand(TestEnvCommand.CommandType.CREATE, commandValueId);
        } else {
            //从history里面查instance，然后再去command里面找value，最后一个创建的value就是最新更改值
            TestEnvCommand needEnvCommand = new TestEnvCommand();
            needEnvCommand.setInstanceId(historyService.queryByPrimaryKey(deployDTO.getHistoryId()).getInstanceId());
            List<TestEnvCommand> envCommands = commandService.queryEnvCommand(needEnvCommand);
            Assert.notNull(envCommands, "error.deploy.retry.envCommands.are.empty");
            TestEnvCommand retryCommand = envCommands.get(0);
            //重用EnvCommandValue表中以前的value数据
            if (!ObjectUtils.isEmpty(retryCommand.getValueId())) {
                commandValue = commandValueService.query(retryCommand.getValueId());
                envCommand = new TestEnvCommand(TestEnvCommand.CommandType.RESTART, commandValue.getId());
            } else {
                envCommand = new TestEnvCommand(TestEnvCommand.CommandType.RESTART, null);
            }
        }

        TestEnvCommand resultCommand = commandService.insertOne(envCommand);
        TestAppInstanceE instanceE = new TestAppInstanceE(deployDTO, resultCommand.getId(), projectId, 0L);
        TestAppInstanceE resultInstance = instanceService.insert(instanceE);

        //回表EncCommand更新instanceId
        resultCommand.setInstanceId(resultInstance.getId());
        commandService.updateByPrimaryKey(resultCommand);

        String frameWork = (String) result.get("framework");
        TestAutomationHistoryE historyE = new TestAutomationHistoryE();
        historyE.setFramework(frameWork);
        historyE.setInstanceId(resultInstance.getId());
        historyE.setProjectId(projectId);
        historyE.setTestStatus(TestAutomationHistoryE.Status.NONEXECUTION);
        historyService.insert(historyE);

        //开始部署
        DevopsApplicationDeployDTO devopsDeployDTO = new DevopsApplicationDeployDTO(deployDTO, resultInstance.getId(), replaceResult.getYaml());
        testCaseService.deployTestApp(projectId, devopsDeployDTO);

        return ConvertHelper.convert(resultInstance, TestAppInstanceDTO.class);
    }

    private List<ErrorLineDTO> getErrorLine(String value) {
        List<ErrorLineDTO> errorLines = new ArrayList<>();
        List<Long> lineNumbers = new ArrayList<>();
        String[] errorMsg = value.split("\\^");
        for (int i = 0; i < value.length(); i++) {
            int j;
            for (j = i; j < value.length(); j++) {
                if (value.substring(i, j).equals("line")) {
                    lineNumbers.add(TypeUtil.objToLong(value.substring(j, value.indexOf(',', j)).trim()));
                }
            }
        }
        for (int i = 0; i < lineNumbers.size(); i++) {
            ErrorLineDTO errorLineDTO = new ErrorLineDTO();
            errorLineDTO.setLineNumber(lineNumbers.get(i));
            errorLineDTO.setErrorMsg(errorMsg[i]);
            errorLines.add(errorLineDTO);
        }
        return errorLines;
    }

    /**
     * devops更新实例信息
     *
     * @param releaseNames
     * @param podName
     * @param conName
     */
    @Override
    public void updateInstance(String releaseNames, String podName, String conName) {

        TestAppInstanceE testAppInstanceE = new TestAppInstanceE();
        //更新实例状态
        testAppInstanceE.setId(Long.getLong(TestAppInstanceE.getInstanceIDFromReleaseName(releaseNames)));
        TestAppInstanceE testAppInstanceE1 = instanceService.queryOne(testAppInstanceE);
        testAppInstanceE.setObjectVersionNumber(testAppInstanceE1.getObjectVersionNumber());
        testAppInstanceE.setPodStatus(0L);
        testAppInstanceE.setPodName(podName);
        testAppInstanceE.setContainerName(conName);
        instanceService.update(testAppInstanceE);
    }

    /**
     * 关闭实例
     *
     * @param releaseNames
     * @param status
     * @param logFile
     */
    @Override
    public void closeInstance(String releaseNames, Long status, String logFile) {
        TestAppInstanceE testAppInstanceE = new TestAppInstanceE();
        testAppInstanceE.setId(Long.getLong(TestAppInstanceE.getInstanceIDFromReleaseName(releaseNames)));
        TestAppInstanceE testAppInstanceE1 = instanceService.queryOne(testAppInstanceE);
        testAppInstanceE.setObjectVersionNumber(testAppInstanceE1.getObjectVersionNumber());

        TestAppInstanceLogE logE = new TestAppInstanceLogE();
        logE.setLog(logFile);
        testAppInstanceE.setLogId(testAppInstanceLogService.insert(logE).getId());
        testAppInstanceE.setPodStatus(status);
        instanceService.update(testAppInstanceE);
    }


    @Override
    public void shutdownInstance(Long instanceId, Long status) {
        if (status.equals(0L))
            return;
        TestAppInstanceE testAppInstanceE = new TestAppInstanceE();

        //更新实例状态
        testAppInstanceE.setId(instanceId);
        TestAppInstanceE testAppInstanceE1 = instanceService.queryOne(testAppInstanceE);
        testAppInstanceE.setObjectVersionNumber(testAppInstanceE1.getObjectVersionNumber());
        testAppInstanceE.setPodStatus(1L);
        instanceService.update(testAppInstanceE);

    }

}

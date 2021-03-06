package io.choerodon.test.manager.api.vo;

import io.choerodon.test.manager.api.vo.agile.StatusVO;
import io.choerodon.test.manager.infra.dto.UserMessageDTO;
import org.hzero.starter.keyencrypt.core.Encrypt;

import java.util.List;

/**
 * @author superlee
 * @since 2020-12-11
 */
public class TestPlanReporterIssueVO {

    @Encrypt
    private Long issueId;

    private String summary;

    private StatusVO statusMapVO;

    private UserMessageDTO assignee;

    private List<TestFolderCycleCaseVO> testFolderCycleCases;

    @Encrypt
    private Long statusId;

    @Encrypt
    private Long userId;

    private String caseSummary;

    @Encrypt
    private Long executionStatus;

    private Long passStatusId;

    private Integer passedCaseCount;

    public Integer getPassedCaseCount() {
        return passedCaseCount;
    }

    public void setPassedCaseCount(Integer passedCaseCount) {
        this.passedCaseCount = passedCaseCount;
    }

    public Long getPassStatusId() {
        return passStatusId;
    }

    public void setPassStatusId(Long passStatusId) {
        this.passStatusId = passStatusId;
    }

    public String getCaseSummary() {
        return caseSummary;
    }

    public void setCaseSummary(String caseSummary) {
        this.caseSummary = caseSummary;
    }

    public Long getExecutionStatus() {
        return executionStatus;
    }

    public void setExecutionStatus(Long executionStatus) {
        this.executionStatus = executionStatus;
    }

    public Long getStatusId() {
        return statusId;
    }

    public void setStatusId(Long statusId) {
        this.statusId = statusId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public StatusVO getStatusMapVO() {
        return statusMapVO;
    }

    public void setStatusMapVO(StatusVO statusMapVO) {
        this.statusMapVO = statusMapVO;
    }

    public UserMessageDTO getAssignee() {
        return assignee;
    }

    public void setAssignee(UserMessageDTO assignee) {
        this.assignee = assignee;
    }

    public List<TestFolderCycleCaseVO> getTestFolderCycleCases() {
        return testFolderCycleCases;
    }

    public void setTestFolderCycleCases(List<TestFolderCycleCaseVO> testFolderCycleCases) {
        this.testFolderCycleCases = testFolderCycleCases;
    }
}

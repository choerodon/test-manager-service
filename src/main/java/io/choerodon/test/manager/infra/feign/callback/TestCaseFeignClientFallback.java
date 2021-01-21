package io.choerodon.test.manager.infra.feign.callback;

import java.util.List;

import io.choerodon.core.domain.Page;
import io.choerodon.test.manager.api.vo.agile.*;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import io.choerodon.core.exception.CommonException;
import io.choerodon.test.manager.infra.feign.TestCaseFeignClient;

/**
 * Created by 842767365@qq.com on 6/13/18.
 */
@Component
public class TestCaseFeignClientFallback implements TestCaseFeignClient {

    private static final String QUERY_ERROR = "error.baseFeign.query";
    private static final String UPDATE_ERROR = "error.baseFeign.update";
    private static final String CREATE_ERROR = "error.baseFeign.create";

    @Override
    public ResponseEntity<String> createIssue(Long projectId, String applyType, IssueCreateDTO issueCreateDTO) {
        throw new CommonException(CREATE_ERROR);
    }


    @Override
    public ResponseEntity<String> queryIssue(Long projectId, Long issueId, Long organizationId) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> listIssueWithoutSubToTestComponent(Long projectId, SearchDTO searchDTO, Long organizationId, int page, int size, String sort) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> listByIssueIds(Long projectId, List<Long> issueIds) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> listIssueLinkByBatch(Long projectId, List<Long> issueIds) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> listIssueWithoutSubDetail(int page, int size, String orders, Long projectId, SearchDTO searchDTO, Long organizationId) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> queryIssueIdsByOptions(Long projectId, SearchDTO searchDTO) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> batchIssueToVersion(Long projectId, Long versionId, List<Long> issueIds) {
        throw new CommonException(UPDATE_ERROR);
    }

    @Override
    public ResponseEntity<List<Long>> batchCloneIssue(Long projectId, Long versionId, Long[] issueIds) {
        throw new CommonException(CREATE_ERROR);
    }

    @Override
    public ResponseEntity batchDeleteIssues(Long projectId, List<Long> issueIds) {
        throw new CommonException(UPDATE_ERROR);
    }

    @Override
    public ResponseEntity batchIssueToVersionTest(Long projectId, Long versionId, List<Long> issueIds) {
        throw new CommonException(UPDATE_ERROR);
    }

    @Override
    public ResponseEntity<String> listIssueWithLinkedIssues(int page, int size, String orders, Long projectId, SearchDTO searchDTO, Long organizationId) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<Page<ComponentForListDTO>> listByProjectId(Long projectId, SearchDTO searchDTO) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<List<IssueLabelDTO>> listIssueLabel(Long projectId) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> queryLookupValueByCode(String typeCode) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> listStatusByProjectId(Long projectId) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> listIssueLinkType(Long projectId, Long issueLinkTypeId, IssueLinkTypeSearchDTO issueLinkTypeSearchDTO) {
        throw new CommonException(QUERY_ERROR);
    }

    @Override
    public ResponseEntity<String> queryIssueByIssueNum(Long projectId, String issueNum) {
        throw new CommonException(QUERY_ERROR);
    }
}

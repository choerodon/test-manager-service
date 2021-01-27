package io.choerodon.test.manager.api.controller.v1;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;

import io.choerodon.core.iam.ResourceLevel;
import io.choerodon.swagger.annotation.Permission;

import io.choerodon.core.exception.CommonException;
import io.choerodon.test.manager.api.vo.TestCaseAttachmentCombineVO;
import io.choerodon.test.manager.app.service.TestCaseAttachmentService;
import io.choerodon.test.manager.infra.dto.TestCaseAttachmentDTO;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.hzero.starter.keyencrypt.core.Encrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * @author zhaotianxin
 * @since 2019/11/21
 */
@RestController
@RequestMapping("/v1/projects/{project_id}/attachment")
public class TestCaseAttachmentController {

    @Autowired
    private TestCaseAttachmentService testCaseAttachmentService;

    @Permission(level = ResourceLevel.ORGANIZATION)
    @ApiOperation("上传附件")
    @PostMapping
    public ResponseEntity<List<TestCaseAttachmentDTO>> uploadAttachment(@ApiParam(value = "项目id", required = true)
                                                                        @PathVariable(name = "project_id") Long projectId,
                                                                        @ApiParam(value = "issue id", required = true)
                                                                        @RequestParam
                                                                        @Encrypt Long caseId,
                                                                        HttpServletRequest request) {
        return Optional.ofNullable(testCaseAttachmentService.create(projectId, caseId, request))
                .map(result -> new ResponseEntity<>(result, HttpStatus.CREATED))
                .orElseThrow(() -> new CommonException("error.attachment.upload"));
    }

    @Permission(level = ResourceLevel.ORGANIZATION)
    @ApiOperation("删除附件")
    @DeleteMapping(value = "/{issueAttachment_id}")
    public ResponseEntity deleteAttachment(@ApiParam(value = "项目id", required = true)
                                           @PathVariable(name = "project_id") Long projectId,
                                           @ApiParam(value = "附件id", required = true)
                                           @PathVariable(name = "issueAttachment_id")
                                           @Encrypt Long issueAttachmentId) {
        testCaseAttachmentService.delete(projectId, issueAttachmentId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @Permission(level = ResourceLevel.ORGANIZATION)
    @ApiOperation("上传附件，直接返回地址")
    @PostMapping(value = "/upload_for_address")
    public ResponseEntity<List<String>> uploadForAddress(@ApiParam(value = "project id", required = true)
                                                         @PathVariable(name = "project_id") Long projectId,
                                                         HttpServletRequest request) {
        return Optional.ofNullable(testCaseAttachmentService.uploadForAddress(projectId, request))
                .map(result -> new ResponseEntity<>(result, HttpStatus.CREATED))
                .orElseThrow(() -> new CommonException("error.attachment.upload"));
    }

    @Permission(level = ResourceLevel.ORGANIZATION)
    @ApiOperation("合并上传切片，创建附件记录")
    @PostMapping("/combine")
    public ResponseEntity<TestCaseAttachmentDTO> attachmentCombineBlock(@ApiParam(value = "项目id", required = true)
                                                                        @PathVariable(name = "project_id") Long projectId,
                                                                        @ApiParam(value = "分片合并参数", required = true)
                                                                        @RequestBody TestCaseAttachmentCombineVO testCaseAttachmentCombineVO) {
        testCaseAttachmentService.validCombineUpload(testCaseAttachmentCombineVO);
        return Optional.ofNullable(testCaseAttachmentService.attachmentCombineUpload(projectId, testCaseAttachmentCombineVO))
                .map(result -> new ResponseEntity<>(result, HttpStatus.CREATED))
                .orElseThrow(() -> new CommonException("error.attachment.upload"));
    }
}

package io.choerodon.test.manager.api.vo.agile;


import io.swagger.annotations.ApiModelProperty;
import org.hzero.starter.keyencrypt.core.Encrypt;

import java.io.Serializable;

import io.choerodon.test.manager.infra.util.StringUtil;

/**
 * @author dinghuang123@gmail.com
 * @since 2018/11/7
 */
public class IssueSprintVO implements Serializable {

    @ApiModelProperty(value = "冲刺名称")
    private String sprintName;

    @ApiModelProperty(value = "状态code")
    private String statusCode;

    @ApiModelProperty(value = "冲刺id")
    @Encrypt
    private Long sprintId;

    public String getSprintName() {
        return sprintName;
    }

    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
    }

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }

    public Long getSprintId() {
        return sprintId;
    }

    public void setSprintId(Long sprintId) {
        this.sprintId = sprintId;
    }

    @Override
    public String toString() {
        return StringUtil.getToString(this);
    }
}

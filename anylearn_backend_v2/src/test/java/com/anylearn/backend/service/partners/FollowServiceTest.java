package com.anylearn.backend.service.partners;

import com.anylearn.backend.entity.Item;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FollowServiceTest {

    private static Item item(Integer status, Integer userStatus) {
        Item item = new Item();
        item.setStatus(status == null ? null : status.byteValue());
        item.setUserStatus(userStatus == null ? null : userStatus.byteValue());
        return item;
    }

    @Test
    void aCourseIsOpenOnlyWhenBothSwitchesAreOn() {
        assertThat(FollowService.isLive(item(1, 1))).isTrue();
        assertThat(FollowService.isLive(item(1, 0))).isFalse();
        assertThat(FollowService.isLive(item(0, 1))).isFalse();
        assertThat(FollowService.isLive(item(null, null))).isFalse();
    }
}

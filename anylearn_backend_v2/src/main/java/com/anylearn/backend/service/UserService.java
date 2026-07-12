package com.anylearn.backend.service;

import com.anylearn.backend.dto.response.UserInfoResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserDocumentRepository userDocumentRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ItemUserActionRepository itemUserActionRepository;

    public Map<String, Object> usersList(String role, int pageSize) {
        if (!List.of("teacher", "school").contains(role)) {
            throw new IllegalArgumentException("Yêu cầu không đúng");
        }

        var page = userRepository.findActiveByRole(role, PageRequest.of(0, pageSize));

        var list = page.getContent().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("role", u.getRole());
            m.put("image", u.getImage());
            m.put("banner", u.getBanner());
            m.put("introduce", u.getIntroduce());
            m.put("title", u.getTitle());
            m.put("num_friends", u.getNumFriends());
            m.put("rating", itemUserActionRepository.avgRatingByOwner(u.getId()));
            return m;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", list);
        return result;
    }

    public Map<String, Object> profile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        var pageable = PageRequest.of(0, 10);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId());
        result.put("title", user.getTitle());
        result.put("name", user.getName());
        result.put("image", user.getImage());
        result.put("role", user.getRole());
        result.put("introduce", user.getIntroduce());
        result.put("banner", user.getBanner());
        result.put("full_content", user.getFullContent());
        result.put("docs", userDocumentRepository.findByUserId(userId));
        result.put("registered", orderDetailRepository.findRegisteredItemsByUser(userId, pageable));
        result.put("faved", itemUserActionRepository.findFavedItemsByUser(userId, pageable));
        result.put("rated", itemUserActionRepository.findRatedItemsByUser(userId, pageable));
        return result;
    }

    public Map<String, Object> userInfo(User user) {
        var children = userRepository.findByUserIdAndIsChild(user.getId(), (byte) 1);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("user", new UserInfoResponse(user));
        result.put("children", children.stream().map(UserInfoResponse::new).toList());
        return result;
    }

    public Map<String, Object> userInfoLess(User user) {
        var children = userRepository.findByUserIdAndIsChild(user.getId(), (byte) 1);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("user", new UserInfoResponse(user));
        result.put("children", children.stream().map(UserInfoResponse::new).toList());
        result.put("cartcount", 0); // TODO: implement cart count
        result.put("hasPendingOrder", false); // TODO: implement pending order check
        return result;
    }
}

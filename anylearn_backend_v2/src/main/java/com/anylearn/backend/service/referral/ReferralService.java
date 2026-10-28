package com.anylearn.backend.service.referral;

import com.anylearn.backend.entity.ReferralEvent;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ReferralEventRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReferralService {

    private final UserRepository userRepository;
    private final ReferralEventRepository eventRepository;

    /** The person a link points at, or empty when the code is wrong, belongs to a child or to the registering phone. */
    public Optional<User> findReferrer(String rawCode, String newPhone) {
        String code = ReferralRules.cleanCode(rawCode);
        if (code == null) return Optional.empty();
        return userRepository.findFirstByRefcode(code).filter(u -> ReferralRules.canRefer(u, newPhone));
    }

    /** Never blocks a registration: a failure here is only logged. */
    public void record(User referrer, User newUser, String rawGame) {
        try {
            ReferralEvent event = new ReferralEvent();
            event.setReferrerId(referrer.getId());
            event.setNewUserId(newUser.getId());
            event.setGameId(ReferralRules.cleanGame(rawGame));
            eventRepository.save(event);
        } catch (Exception e) {
            log.warn("[referral] could not record {} -> {}: {}", referrer.getId(), newUser.getId(), e.getMessage());
        }
    }
}

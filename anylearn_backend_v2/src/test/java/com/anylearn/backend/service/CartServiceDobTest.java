package com.anylearn.backend.service;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemUserAction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.exception.LearnerDobRequiredException;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemUserActionRepository;
import com.anylearn.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

// Checkout must refuse learners that only have a birth year, and must not create anything before refusing.
class CartServiceDobTest {

    private ItemUserActionRepository actions;
    private ItemRepository items;
    private UserRepository users;
    private CartService service;
    private User parent;

    @BeforeEach
    void setUp() throws Exception {
        actions = mock(ItemUserActionRepository.class);
        items = mock(ItemRepository.class);
        users = mock(UserRepository.class);
        service = newCartService();
        parent = learner(1L, LocalDate.of(1985, 5, 5), false);
        when(users.findById(1L)).thenReturn(Optional.of(parent));
    }

    // CartService has one constructor with many repositories; the checkout guard only touches three of them.
    private CartService newCartService() throws Exception {
        Constructor<?> constructor = CartService.class.getDeclaredConstructors()[0];
        Object[] arguments = new Object[constructor.getParameterCount()];
        Class<?>[] types = constructor.getParameterTypes();
        for (int index = 0; index < types.length; index++) {
            arguments[index] = types[index] == ObjectMapper.class ? new ObjectMapper() : mock(types[index]);
        }
        arguments[indexOf(types, ItemUserActionRepository.class)] = actions;
        arguments[indexOf(types, ItemRepository.class)] = items;
        arguments[indexOf(types, UserRepository.class)] = users;
        return (CartService) constructor.newInstance(arguments);
    }

    private static int indexOf(Class<?>[] types, Class<?> wanted) {
        for (int index = 0; index < types.length; index++) if (types[index] == wanted) return index;
        throw new IllegalStateException(wanted.getSimpleName());
    }

    private static User learner(Long id, LocalDate dob, boolean yearOnly) {
        User user = new User();
        user.setId(id);
        user.setDob(dob);
        user.setDobYearOnly(yearOnly);
        return user;
    }

    private ItemUserAction cartLine(long itemId, Long studentId) {
        ItemUserAction action = new ItemUserAction();
        action.setItemId(itemId);
        action.setUserId(1L);
        action.setType("cart");
        action.setExtraValue(studentId == null ? "{}" : "{\"studentId\":" + studentId + "}");
        return action;
    }

    @Test
    void refusesAChildWithOnlyABirthYearAndNamesThem() {
        when(users.findById(11L)).thenReturn(Optional.of(learner(11L, LocalDate.of(2015, 1, 1), true)));
        when(actions.findCartByUser(1L)).thenReturn(List.of(cartLine(5, 11L)));

        assertThatThrownBy(() -> service.checkout("bank_transfer", null, null, parent))
                .isInstanceOfSatisfying(LearnerDobRequiredException.class,
                        ex -> assertThat(ex.getLearnerIds()).containsExactly(11L));
        verify(actions).findCartByUser(1L);
        verifyNoMoreInteractions(actions);
    }

    @Test
    void refusesTheAccountOwnerWithoutADateOfBirth() {
        parent.setDob(null);
        when(actions.findCartByUser(1L)).thenReturn(List.of(cartLine(5, null)));

        assertThatThrownBy(() -> service.checkout("bank_transfer", null, null, parent))
                .isInstanceOfSatisfying(LearnerDobRequiredException.class,
                        ex -> assertThat(ex.getLearnerIds()).containsExactly(1L));
    }

    @Test
    void listsEachIncompleteLearnerOnce() {
        when(users.findById(11L)).thenReturn(Optional.of(learner(11L, LocalDate.of(2015, 1, 1), true)));
        when(users.findById(12L)).thenReturn(Optional.of(learner(12L, LocalDate.of(2017, 4, 1), false)));
        when(actions.findCartByUser(1L)).thenReturn(List.of(cartLine(5, 11L), cartLine(6, 11L), cartLine(7, 12L)));

        assertThatThrownBy(() -> service.checkout("bank_transfer", null, null, parent))
                .isInstanceOfSatisfying(LearnerDobRequiredException.class,
                        ex -> assertThat(ex.getLearnerIds()).containsExactly(11L));
    }

    @Test
    void checksTheAgeLimitWithTheExactDateOnceItIsComplete() {
        // Turns 10 tomorrow: with only the birth year he could pass an 11+ course, the exact date says no.
        // (Item age range is 11+; the learner is still 9.)
        User child = learner(11L, LocalDate.now().minusYears(10).plusDays(1), false);
        Item item = new Item();
        item.setId(5L);
        item.setAgesMin((byte) 11);
        when(users.findById(11L)).thenReturn(Optional.of(child));
        when(items.findById(5L)).thenReturn(Optional.of(item));
        when(actions.findCartByUser(1L)).thenReturn(List.of(cartLine(5, 11L)));

        assertThatThrownBy(() -> service.checkout("bank_transfer", null, null, parent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("chưa đủ tuổi");
    }

    @Test
    void anEmptyCartIsStillRefusedFirst() {
        when(actions.findCartByUser(1L)).thenReturn(List.of());

        assertThatThrownBy(() -> service.checkout("bank_transfer", null, null, parent))
                .hasMessageContaining("Giỏ hàng trống");
    }
}

package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "participations")
@Getter @Setter
public class Participation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @Column(name = "organizer_user_id", nullable = false)
    private Long organizerUserId;

    @Column(name = "participant_user_id", nullable = false)
    private Long participantUserId;

    @Column(name = "organizer_confirm", nullable = false)
    private Byte organizerConfirm;

    @Column(name = "participant_confirm", nullable = false)
    private Byte participantConfirm;

    @Column(name = "organizer_comment")
    private String organizerComment;

    @Column(name = "participant_comment")
    private String participantComment;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

package com.anylearn.backend.service.push;

import com.anylearn.backend.entity.PushSubscription;

// Sends one encrypted message to one browser and returns the HTTP status of the push service.
// An interface so tests can check what WebPushService does with each status without the network.
public interface PushTransport {

    int send(PushSubscription subscription, byte[] payload) throws Exception;
}

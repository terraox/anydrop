package com.anydrop.backend.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.awt.*;

@Controller
public class RemoteControlController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RemoteControlController.class);

    private Robot robot;

    public RemoteControlController() {
        try {
            // Check if not headless before creating Robot
            if (!GraphicsEnvironment.isHeadless()) {
                this.robot = new Robot();
            } else {
                log.warn("Headless environment detected. Remote control will not work.");
            }
        } catch (AWTException e) {
            log.error("Failed to initialize Robot", e);
        }
    }

    @MessageMapping("/control.move")
    public void moveMouse(MousePayload payload) {
        if (robot == null)
            return;

        Point location = MouseInfo.getPointerInfo().getLocation();
        int newX = (int) location.getX() + payload.getDx();
        int newY = (int) location.getY() + payload.getDy();

        robot.mouseMove(newX, newY);
    }
}

class MousePayload {
    private int dx;
    private int dy;

    public MousePayload() {
    }

    public int getDx() {
        return dx;
    }

    public void setDx(int dx) {
        this.dx = dx;
    }

    public int getDy() {
        return dy;
    }

    public void setDy(int dy) {
        this.dy = dy;
    }
}

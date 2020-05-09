Hooks.on("ready", () => {
  let wall = null;
  let wallId = null;

  // add the notifications div
  $("body").append(`
  <div id="vtta-notifications">
  </div>`);

  // create the notification area
  window.notification = {
    add: (message, timeout = 2000) => {
      let note = $(`<div>${message}</div>`);
      $("#vtta-notifications").append(note);
      console.log(note);

      setTimeout(() => {
        $(note).hide(200, event => {
          console.log(event);
          $(note).remove();
        });
      }, timeout);
    },
  };

  const _onWallKeyUp = async event => {
    if (wall) {
      switch (event.code) {
        case "KeyD":
          const doors = ["None", "Door", "Secret"];
          wall.door = wall.door ? wall.door + 1 : 1;
          if (wall.door > doors.length - 1) wall.door = 0;
          await game.scenes.viewed.updateEmbeddedEntity("Wall", { _id: wallId, door: wall.door });
          wall = game.scenes.viewed.getEmbeddedEntity("Wall", wallId);

          window.notification.add(`Door: ${doors[wall.door]}`);
          break;

        case "KeyW":
          //await wall.update({});
          const dirs = ["Both", "Left", "Right"];
          wall.dir = wall.dir ? wall.dir + 1 : 1;
          if (wall.dir > dirs.length - 1) wall.dir = 0;

          await game.scenes.viewed.updateEmbeddedEntity("Wall", { _id: wallId, dir: wall.dir });
          wall = game.scenes.viewed.getEmbeddedEntity("Wall", wallId);
          window.notification.add(`Wall direction: ${dirs[wall.dir]}`);
          break;

        case "KeyM":
          //await wall.update({});
          const movementRestrictions = ["Unrestricted", "Restricted"];
          wall.move = wall.move ? wall.move + 1 : 1;
          if (wall.move > movementRestrictions.length - 1) wall.move = 0;

          await game.scenes.viewed.updateEmbeddedEntity("Wall", { _id: wallId, move: wall.move });
          wall = game.scenes.viewed.getEmbeddedEntity("Wall", wallId);
          window.notification.add(`Movement: ${movementRestrictions[wall.move]}`);
          break;
          m;

        case "KeyP":
          const senses = ["Invisible", "Normal", "Terrain Wall"];
          wall.sense = wall.sense ? wall.sense + 1 : 1;
          if (wall.sense > senses.length - 1) wall.sense = 0;
          if (wall.sense === 3) wall.sense = 0;

          await game.scenes.viewed.updateEmbeddedEntity("Wall", { _id: wallId, sense: wall.sense });
          wall = game.scenes.viewed.getEmbeddedEntity("Wall", wallId);
          window.notification.add(`Perception: ${senses[wall.sense]}`);
          break;
      }
    }
  };

  let light = null;
  let lightId = null;
  let lastEvent;

  const _onMouseWheel = async event => {
    console.log(light);

    //event.preventDefault();
    const ctrl = event.ctrlKey;
    const shift = event.shiftKey;

    var timeSinceLastEvent;

    if (lastEvent) {
      timeSinceLastEvent = event.timeStamp - lastEvent;
    }
    lastEvent = event.timeStamp;
    console.log("time since last wheel: " + timeSinceLastEvent);

    const direction = event.deltaY < 0 ? -1 : 1;

    const timeFactor = timeSinceLastEvent ? 100 / timeSinceLastEvent : 1;
    console.log(timeFactor);

    let update = {};

    if (shift && !ctrl) {
      const calcStep = val => {
        const FACTOR = 0.1 * timeFactor;
        const MIN_STEP = 0.25;
        let step = val * FACTOR;
        if (step <= MIN_STEP) step = MIN_STEP;
        return step;
      };
      console.log("DIRECTRION: " + direction);
      console.log("STEP DIM " + calcStep(light.dim));
      console.log("STEP bright " + calcStep(light.bright));

      // make radius bigger or smaller
      let newDim = Math.round((light.dim + direction * calcStep(light.dim)) * 10) / 10;
      if (newDim <= 0) newDim = 0;
      let newBright = Math.round((light.bright + direction * calcStep(light.bright)) * 10) / 10;
      if (newBright <= 0) newBright = 0;
      update = {
        _id: lightId,
        dim: newDim,
        bright: newBright,
      };
    }
    if (!shift && ctrl) {
      let newAngle = light.angle + direction * 3 * timeFactor;

      newAngle = newAngle < 0 ? 0 : newAngle > 360 ? 360 : newAngle;
      update = { _id: lightId, angle: newAngle };
    }
    if (shift && ctrl) {
      let newAngle = light.rotation + direction * 3 * timeFactor;
      newAngle = newAngle < 0 ? 360 : newAngle > 360 ? 1 : newAngle;
      update = { _id: lightId, rotation: newAngle };
    }
    console.log(update);
    await game.scenes.viewed.updateEmbeddedEntity("AmbientLight", update);
  };

  Hooks.on("renderLightConfig", (app, html, options) => {
    const data = app.object.data;
    const name = data.flags && data.flags.name ? data.flags.name : "";
    $(html).find("form").prepend(`<div class="form-group">
    <label>Name:</label>
    <input type="text" name="name" placeholder="No name set yet" value="${name}" data-dtype="String">
  </div>`);
    $(html).css("height", "415px");
  });

  Hooks.on("preUpdateAmbientLight", (scene, entity, updateData, options, userId) => {
    console.log(updateData);
    if (updateData.name) {
      if (updateData.flags) {
        updateData.flags.name = updateData.name;
      } else {
        updateData.flags = { name: updateData.name };
      }
      delete updateData.name;
    }
  });

  Hooks.on("hoverAmbientLight", async (entity, isHovering) => {
    lightId = entity.data._id;
    light = game.scenes.viewed.getEmbeddedEntity("AmbientLight", lightId);

    if (isHovering) {
      //do something
      console.log("Adding event listener");
      document.body.addEventListener("wheel", _onMouseWheel, {
        passive: false,
      });
    } else {
      console.log("Removing event listener");
      document.body.removeEventListener("wheel", _onMouseWheel);
    }
  });

  Hooks.on("hoverWall", async (entity, isHovering) => {
    wallId = entity.data._id;
    wall = game.scenes.viewed.getEmbeddedEntity("Wall", wallId);

    if (isHovering) {
      //do something
      console.log("Adding event listener");
      document.body.addEventListener("keyup", _onWallKeyUp);
    } else {
      console.log("Removing event listener");
      document.body.removeEventListener("keyup", _onWallKeyUp);
    }
  });
});

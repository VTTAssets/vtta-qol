Hooks.on("ready", () => {});

Hooks.on("ready", () => {
  let light = null;
  let lightId = null;
  let lastEvent;

  const _onMouseWheel = async (event) => {
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
      const calcStep = (val) => {
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
      let newDim =
        Math.round((light.dim + direction * calcStep(light.dim)) * 10) / 10;
      if (newDim <= 0) newDim = 0;
      let newBright =
        Math.round((light.bright + direction * calcStep(light.bright)) * 10) /
        10;
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

  Hooks.on(
    "preUpdateAmbientLight",
    (scene, entity, updateData, options, userId) => {
      console.log(updateData);
      if (updateData.name) {
        if (updateData.flags) {
          updateData.flags.name = updateData.name;
        } else {
          updateData.flags = { name: updateData.name };
        }
        delete updateData.name;
      }
    }
  );

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
});

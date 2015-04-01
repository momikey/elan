$(function () {
	// Newlines are important
	$.valHooks.textarea = {
		get: function (elem) {
			return elem.value.replace(/\r?\n/g,"\r\n");
		}
	};

	// Compile the code when the button is clicked
	$("#compilebtn").click(function () {
		$("#compiled").val("");
		$("#errors").val("");
		var out;
		try {
			out = Elan.compile($("#source").val(), true);
		} catch (e) {
			$("#errors").val(e);
		}
		$("#compiled").val(out);
	});

	// Add a special character to the source if clicked
	$("tr td:first-child").click(function () {
		$("#source").val($("#source").val() + $(this).text());
	}).css("font-size", "125%");
});

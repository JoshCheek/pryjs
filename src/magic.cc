#include <nan.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>


void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  int fds[6];
  pipe(&fds[0]);
  pipe(&fds[2]);
  pipe(&fds[4]);

  int stdinr  = fds[0], stdinw  = fds[1];
  int stdoutr = fds[2], stdoutw = fds[3];
  int stderrr = fds[4], stderrw = fds[5];

  pid_t pid;
  if(!(pid=fork())) {
    close(stdinr); close(stdoutw); close(stderrw);
    dup2(stdinw,  3); close(stdinw);
    dup2(stdoutr, 4); close(stdoutr);
    dup2(stderrr, 5); close(stderrr);

    char const *str_ruby = "ruby";
    char const *str_dash_e = "-e";
    char const *str_program =
      "puts 'hi'\n"\
      "Signal.list.each { |name, num| trap(name) { puts name } rescue nil }\n"\
      "stdin  = IO.new 3, 'w'\n" \
      "stdout = IO.new 4, 'r'\n" \
      "stderr = IO.new 5, 'r'\n" \
      "stdin.sync  = true\n" \
      "stdout.sync = true\n" \
      "stderr.sync = true\n" \
      "puts \"Type a line (for child)\"\n" \
      "line = gets.chomp\n" \
      "puts \"PRY-IN(#{line.inspect})\"\n" \
      "stdin.puts line\n" \
      "stdin.flush\n" \
      "$stdout.puts \"PRY-OUT(#{stdout.gets.chomp})\"\n" \
      "$stderr.puts \"PRY-ERR(#{stderr.gets.chomp})\"\n" \
      "stdin.close\n" \
      "stdout.close\n" \
      "stderr.close\n" \
      "exit\n";

    char* ruby_argv[] = { (char*)str_ruby, (char*)str_dash_e, (char*)str_program, 0 };
    execvp(ruby_argv[0], ruby_argv);
  }

  int stdino  = dup(STDIN_FILENO);
  int stdouto = dup(STDOUT_FILENO);
  int stderro = dup(STDERR_FILENO);

  FILE* stdinf  = fdopen(stdino,  "r");
  FILE* stdoutf = fdopen(stdouto, "w");
  FILE* stderrf = fdopen(stderro, "w");

  dup2(stdinr,  STDIN_FILENO);
  dup2(stdoutw, STDOUT_FILENO);
  dup2(stderrw, STDERR_FILENO);

  close(stdinr); close(stdinw);
  close(stdoutr); close(stdinw);
  close(stderrr); close(stdinw);

  char buf[2048];
  fgets(buf, sizeof(buf), stdin);
  fprintf(stdout, "PARENT-OUT(%s)\n", buf);
  fprintf(stderr, "PARENT-ERR(%s)\n", buf);
  fflush(stdout);
  fflush(stderr);

  int statloc = -1;
  fprintf(stdoutf, "PRE WAIT\n");
  waitpid(pid, &statloc, 0);
  fprintf(stdoutf, "POST WAIT %d\n", statloc);
  if(WIFEXITED(statloc))   fprintf(stdoutf, "WIFEXITED(%d)\n",   WIFEXITED(statloc));
  if(WIFSIGNALED(statloc)) fprintf(stdoutf, "WIFSIGNALED(%d)\n", WIFSIGNALED(statloc));
  if(WIFSTOPPED(statloc))  fprintf(stdoutf, "WIFSTOPPED(%d)\n",  WIFSTOPPED(statloc));
  if(WEXITSTATUS(statloc)) fprintf(stdoutf, "WEXITSTATUS(%d)\n", WEXITSTATUS(statloc));
  if(WTERMSIG(statloc))    fprintf(stdoutf, "WTERMSIG(%d)\n",    WTERMSIG(statloc));
  if(WCOREDUMP(statloc))   fprintf(stdoutf, "WCOREDUMP(%d)\n",   WCOREDUMP(statloc));
  if(WSTOPSIG(statloc))    fprintf(stdoutf, "WSTOPSIG(%d)\n",    WSTOPSIG(statloc));

  dup2(stdino,  STDIN_FILENO);
  dup2(stdouto, STDOUT_FILENO);
  dup2(stderro, STDERR_FILENO);

  fprintf(stdout, "Type a line (for parent)\n");
  fflush(stdout);
  fgets(buf, sizeof(buf), stdin);
  fprintf(stdout, "PARENT-OUT(%s)\n", buf);
  fprintf(stderr, "PARENT-ERR(%s)\n", buf);

  info.GetReturnValue().Set(
    Nan::New("world").ToLocalChecked()
  );
}

void Init(v8::Local<v8::Object> exports) {
  v8::Local<v8::Context> context = Nan::GetCurrentContext();

  exports->Set(
    Nan::New("start").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Method)->GetFunction(context).ToLocalChecked()
  );
}

NODE_MODULE(hello, Init)
